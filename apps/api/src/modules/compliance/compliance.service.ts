// apps/api/src/modules/compliance/compliance.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import axios                  from 'axios';

export interface ScreeningResult {
  passed:        boolean;
  flagged:       boolean;
  matchScore?:   number;
  matchDetails?: string;
}

export interface ScreeningInput {
  fullName:      string;
  accountNumber: string;
  bankCode:      string;
  country?:      string;
}

/**
 * Compliance Service — OpenSanctions Only
 * ─────────────────────────────────────────────────────────────
 * Covers: OFAC SDN, UN Security Council, EU, UK HMT sanctions,
 *         and 100+ other lists. Free tier sufficient for MVP.
 *
 * WHY THIS EXISTS EVEN THOUGH FINESTPAY AND FLUTTERWAVE SCREEN:
 *  1. SCUML registration requires Elorge to have documented AML
 *     procedures. This service is that procedure — auditable.
 *  2. Elorge instructs Flutterwave to move money. If a sanctioned
 *     person receives funds via Elorge's instruction, Elorge shares
 *     liability. A second layer of defence protects you.
 *  3. OpenSanctions is free. No reason not to.
 *
 * SCOPE: Elorge only screens the Nigerian RECIPIENT (beneficiary).
 * Finestpay is responsible for screening their own UK customers.
 *
 * FUTURE: Add PEP screening when CBN sandbox licence is required.
 */
@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private readonly config: ConfigService) {}

  async screenRecipient(input: ScreeningInput): Promise<ScreeningResult> {
    const apiKey = this.config.get<string>('compliance.openSanctions.apiKey');
    const isDev  = this.config.get<string>('app.nodeEnv') !== 'production';

    // In dev with no API key configured — skip cleanly
    if (!apiKey && isDev) {
      this.logger.debug(`[Compliance] Dev mode — skipping screen for: ${input.fullName}`);
      return { passed: true, flagged: false };
    }

    try {
      return await this.screenWithOpenSanctions(input, apiKey);
    } catch (error) {
      this.logger.error('[Compliance] OpenSanctions screening error', error);

      // Production: fail closed — hold the payout for manual review
      // Development: fail open — don't block development workflow
      if (!isDev) {
        return {
          passed:       false,
          flagged:      true,
          matchDetails: 'Compliance service temporarily unavailable — payout held for review',
        };
      }
      return { passed: true, flagged: false };
    }
  }

  // ── OpenSanctions ─────────────────────────────────────────
  //  Docs: https://www.opensanctions.org/docs/api/
  //  Free tier: 10,000 requests/day — more than enough at MVP.
  //  Set OPEN_SANCTIONS_API_KEY in .env to remove rate limits.
  private async screenWithOpenSanctions(
    input:  ScreeningInput,
    apiKey: string | undefined,
  ): Promise<ScreeningResult> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `ApiKey ${apiKey}`;
    }

    const { data } = await axios.get<{
      results: Array<{ score: number; caption: string; schema: string }>;
    }>(
      'https://api.opensanctions.org/match/default',
      {
        params: {
          q:         input.fullName,
          limit:     5,
          threshold: 0.85,   // Only flag high-confidence matches (≥85%)
          schema:    'Person',
        },
        headers,
        timeout: 8_000,
      },
    );

    const strongMatch = (data.results ?? []).find((r) => r.score >= 0.85);

    if (strongMatch) {
      this.logger.warn(
        `[Compliance] Sanctions match: "${input.fullName}" — ` +
        `score: ${strongMatch.score}, entity: ${strongMatch.caption}`,
      );
      return {
        passed:       false,
        flagged:      true,
        matchScore:   strongMatch.score,
        matchDetails: `Sanctions list match: ${strongMatch.caption} (score: ${strongMatch.score.toFixed(2)})`,
      };
    }

    this.logger.debug(`[Compliance] Clean: ${input.fullName}`);
    return { passed: true, flagged: false };
  }
}