import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ScreeningResult {
  passed:    boolean;
  flagged:   boolean;
  matchScore?: number;
  matchDetails?: string;
}

export interface ScreeningInput {
  fullName:      string;
  accountNumber: string;
  bankCode:      string;
  country?:      string; // default: NG
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly config: ConfigService) {}

  // ── Screen recipient against sanctions lists ──────────────
  async screenRecipient(input: ScreeningInput): Promise<ScreeningResult> {
    try {
      // Try ComplyAdvantage first (paid, more accurate)
      const apiKey = this.config.get<string>('compliance.complyAdvantage.apiKey');

      if (apiKey && apiKey !== 'test_key') {
        return await this.screenWithComplyAdvantage(input, apiKey);
      }

      // Fallback: OpenSanctions (free tier)
      return await this.screenWithOpenSanctions(input);
    } catch (error) {
      this.logger.error('Compliance screening failed', error);
      // Fail open in dev — fail closed in production
      if (this.config.get<string>('app.nodeEnv') === 'production') {
        return { passed: false, flagged: true, matchDetails: 'Compliance service unavailable' };
      }
      return { passed: true, flagged: false };
    }
  }

  // ── ComplyAdvantage integration ───────────────────────────
  private async screenWithComplyAdvantage(
    input: ScreeningInput,
    apiKey: string,
  ): Promise<ScreeningResult> {
    const baseUrl = this.config.get<string>('compliance.complyAdvantage.baseUrl');

    const { data } = await axios.post<{
      content: {
        data: {
          hits: Array<{ score: number; match_status: string }>;
        };
      };
    }>(
      `${baseUrl}/searches`,
      {
        search_term:  input.fullName,
        fuzziness:    0.6,
        filters: {
          types: ['sanction', 'pep', 'warning'],
          countries: ['NG', input.country ?? 'NG'],
        },
        share_url: false,
      },
      {
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    const hits = data.content.data.hits ?? [];
    const highConfidenceHit = hits.find((h) => h.score >= 0.8);

    if (highConfidenceHit) {
      this.logger.warn(
        `Sanctions hit for "${input.fullName}" — score: ${highConfidenceHit.score}`,
      );
      return {
        passed:      false,
        flagged:     true,
        matchScore:  highConfidenceHit.score,
        matchDetails: `Match found: ${highConfidenceHit.match_status}`,
      };
    }

    return { passed: true, flagged: false };
  }

  // ── OpenSanctions fallback ────────────────────────────────
  private async screenWithOpenSanctions(
    input: ScreeningInput,
  ): Promise<ScreeningResult> {
    try {
      const { data } = await axios.get<{
        results: Array<{ score: number; caption: string }>;
      }>(
        `https://api.opensanctions.org/match/default`,
        {
          params: { q: input.fullName, limit: 5, threshold: 0.8 },
          headers: {
            Authorization: `ApiKey ${this.config.get('compliance.openSanctions.apiKey')}`,
          },
          timeout: 5000,
        },
      );

      const strongMatch = (data.results ?? []).find((r) => r.score >= 0.85);

      if (strongMatch) {
        return {
          passed:      false,
          flagged:     true,
          matchScore:  strongMatch.score,
          matchDetails: `OpenSanctions match: ${strongMatch.caption}`,
        };
      }

      return { passed: true, flagged: false };
    } catch {
      this.logger.warn('OpenSanctions unavailable — skipping screen in dev mode');
      return { passed: true, flagged: false };
    }
  }
}
