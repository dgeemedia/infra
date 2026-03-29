import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import type {
  IPspAdapter,
  PspBalanceResponse,
  PspTransferRequest,
  PspTransferResponse,
} from './psp.interface';

interface BanklyTokenResponse {
  access_token: string;
  expires_in:   number;
  token_type:   string;
}

interface BanklyTransferResponse {
  data: {
    endToEndId:  string;
    status:      string;
    sessionId?:  string;
    description: string;
  };
}

interface BanklyBalanceResponse {
  data: {
    availableBalance: number;
    currentBalance:   number;
    currency:         string;
  };
}

interface BanklyNameEnquiryResponse {
  data: {
    accountName:   string;
    accountNumber: string;
    bankCode:      string;
  };
}

@Injectable()
export class BanklyAdapter implements IPspAdapter {
  private readonly logger = new Logger(BanklyAdapter.name);
  private readonly http:   AxiosInstance;
  private accessToken:     string | null = null;
  private tokenExpiresAt:  Date          = new Date(0);

  constructor(private readonly config: ConfigService) {
    const baseUrl = this.config.get<string>('psp.bankly.baseUrl')
      ?? 'https://api.bankly.ng';

    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 30_000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Attach auth token to every request
    this.http.interceptors.request.use(async (cfg) => {
      const token = await this.getAccessToken();
      cfg.headers['Authorization'] = `Bearer ${token}`;
      return cfg;
    });
  }

  // ── Transfer ──────────────────────────────────────────────
  async transfer(req: PspTransferRequest): Promise<PspTransferResponse> {
    try {
      this.logger.log(`Initiating transfer: ${req.reference} → ${req.bankCode}/${req.accountNumber}`);

      const walletAccount = this.config.get<string>('psp.bankly.walletAccount');

      const { data } = await this.http.post<BanklyTransferResponse>(
        '/funds-transfer',
        {
          amount:             req.amount,
          sourceBankAccount:  walletAccount,
          destinationBankCode:    req.bankCode,
          destinationBankAccount: req.accountNumber,
          destinationBranchCode: '0001',
          destinationAccountName: req.accountName,
          description:        req.narration,
          endToEndId:         req.reference,        // idempotency key
          currency:           'NGN',
          paymentType:        'TEF',
        },
      );

      const status = this.mapStatus(data.data.status);

      return {
        success:      status !== 'failed',
        pspReference: data.data.endToEndId,
        status,
        bankSession:  data.data.sessionId,
        message:      data.data.description,
      };
    } catch (error) {
      this.logger.error(`Bankly transfer failed: ${req.reference}`, error);
      return {
        success:      false,
        pspReference: req.reference,
        status:       'failed',
        message:      this.extractErrorMessage(error),
      };
    }
  }

  // ── Check Status ──────────────────────────────────────────
  async checkStatus(pspReference: string): Promise<PspTransferResponse> {
    try {
      const { data } = await this.http.get<BanklyTransferResponse>(
        `/funds-transfer/${pspReference}`,
      );

      return {
        success:      data.data.status.toLowerCase() === 'successful',
        pspReference: data.data.endToEndId,
        status:       this.mapStatus(data.data.status),
        bankSession:  data.data.sessionId,
      };
    } catch (error) {
      this.logger.error(`Status check failed for: ${pspReference}`, error);
      return {
        success:      false,
        pspReference,
        status:       'failed',
        message:      'Status check failed',
      };
    }
  }

  // ── Get Balance ───────────────────────────────────────────
  async getBalance(): Promise<PspBalanceResponse> {
    const walletAccount = this.config.get<string>('psp.bankly.walletAccount');
    const { data } = await this.http.get<BanklyBalanceResponse>(
      `/accounts/${walletAccount}/balance`,
    );
    return {
      available: data.data.availableBalance,
      ledger:    data.data.currentBalance,
      currency:  data.data.currency,
    };
  }

  // ── Validate Account (NIP Name Enquiry) ───────────────────
  async validateAccount(
    bankCode:      string,
    accountNumber: string,
  ): Promise<{ valid: boolean; accountName: string }> {
    try {
      const { data } = await this.http.get<BanklyNameEnquiryResponse>(
        `/name-enquiry`,
        { params: { accountNumber, bankCode } },
      );
      return {
        valid:       true,
        accountName: data.data.accountName,
      };
    } catch {
      return { valid: false, accountName: '' };
    }
  }

  // ── Auth token management ─────────────────────────────────
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && new Date() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const clientId     = this.config.get<string>('psp.bankly.clientId');
    const clientSecret = this.config.get<string>('psp.bankly.clientSecret');

    const { data } = await axios.post<BanklyTokenResponse>(
      'https://identity.bankly.com.ng/connect/token',
      new URLSearchParams({
        grant_type:    'client_credentials',
        client_id:     clientId ?? '',
        client_secret: clientSecret ?? '',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    this.accessToken    = data.access_token;
    this.tokenExpiresAt = new Date(Date.now() + data.expires_in * 1000 - 60_000);

    return this.accessToken;
  }

  // ── Helpers ───────────────────────────────────────────────
  private mapStatus(banklyStatus: string): PspTransferResponse['status'] {
    const map: Record<string, PspTransferResponse['status']> = {
      successful:  'successful',
      success:     'successful',
      completed:   'successful',
      pending:     'pending',
      inprogress:  'pending',
      failed:      'failed',
      rejected:    'failed',
      reversed:    'reversed',
    };
    return map[banklyStatus.toLowerCase()] ?? 'failed';
  }

  private extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as Record<string, unknown> | undefined;
      return (data?.['message'] as string) ?? (data?.['errors'] as string) ?? error.message;
    }
    return 'Unknown PSP error';
  }
}
