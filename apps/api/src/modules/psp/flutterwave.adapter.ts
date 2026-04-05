// apps/api/src/modules/psp/flutterwave.adapter.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

import type {
  IPspAdapter,
  PspBalanceResponse,
  PspTransferRequest,
  PspTransferResponse,
} from './psp.interface';

interface FlwTransferResponse {
  status:  string;
  message: string;
  data: {
    id:          number;
    reference:   string;
    status:      string;
    complete_message: string;
    bank_name?:  string;
    session_id?: string;
  };
}

interface FlwBalanceResponse {
  status: string;
  data: {
    currency:           string;
    available_balance:  number;
    ledger_balance:     number;
  };
}

interface FlwResolveResponse {
  status: string;
  data: {
    account_number: string;
    account_name:   string;
  };
}

@Injectable()
export class FlutterwaveAdapter implements IPspAdapter {
  private readonly logger = new Logger(FlutterwaveAdapter.name);
  private readonly http:   AxiosInstance;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('psp.flutterwave.secretKey') ?? '';
    const baseUrl   = this.config.get<string>('psp.flutterwave.baseUrl')
      ?? 'https://api.flutterwave.com/v3';

    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 30_000,
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type':  'application/json',
      },
    });
  }

  // ── Transfer ──────────────────────────────────────────────
  async transfer(req: PspTransferRequest): Promise<PspTransferResponse> {
    try {
      this.logger.log(
        `[FLW] Initiating transfer: ${req.reference} → ${req.bankCode}/${req.accountNumber} ₦${req.amount}`,
      );

      const { data } = await this.http.post<FlwTransferResponse>('/transfers', {
        account_bank:     req.bankCode,
        account_number:   req.accountNumber,
        amount:           req.amount,
        narration:        req.narration,
        currency:         'NGN',
        reference:        req.reference,   // idempotency key
        beneficiary_name: req.accountName,
        debit_currency:   'NGN',
      });

      if (data.status === 'success') {
        const mapped = this.mapStatus(data.data.status);
        return {
          success:      mapped !== 'failed',
          pspReference: String(data.data.id),
          status:       mapped,
          bankSession:  data.data.session_id,
          message:      data.data.complete_message,
        };
      }

      return {
        success:      false,
        pspReference: req.reference,
        status:       'failed',
        message:      data.message,
      };
    } catch (error) {
      this.logger.error(`[FLW] Transfer failed: ${req.reference}`, error);
      return {
        success:      false,
        pspReference: req.reference,
        status:       'failed',
        message:      this.extractError(error),
      };
    }
  }

  // ── Check Status ──────────────────────────────────────────
  async checkStatus(pspReference: string): Promise<PspTransferResponse> {
    try {
      // Flutterwave uses numeric IDs for status checks
      const { data } = await this.http.get<FlwTransferResponse>(
        `/transfers/${pspReference}`,
      );

      return {
        success:      data.data.status === 'SUCCESSFUL',
        pspReference: String(data.data.id),
        status:       this.mapStatus(data.data.status),
        message:      data.data.complete_message,
      };
    } catch (error) {
      this.logger.error(`[FLW] Status check failed: ${pspReference}`, error);
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
    const { data } = await this.http.get<FlwBalanceResponse>(
      '/balances/NGN',
    );
    return {
      available: data.data.available_balance,
      ledger:    data.data.ledger_balance,
      currency:  data.data.currency,
    };
  }

  // ── Validate Account (NIBSS Name Enquiry) ─────────────────
  async validateAccount(
    bankCode:      string,
    accountNumber: string,
  ): Promise<{ valid: boolean; accountName: string }> {
    try {
      const { data } = await this.http.post<FlwResolveResponse>(
        '/accounts/resolve',
        { account_number: accountNumber, account_bank: bankCode },
      );

      if (data.status === 'success') {
        return { valid: true, accountName: data.data.account_name };
      }
      return { valid: false, accountName: '' };
    } catch {
      return { valid: false, accountName: '' };
    }
  }

  // ── Helpers ───────────────────────────────────────────────
  private mapStatus(flwStatus: string): PspTransferResponse['status'] {
    const map: Record<string, PspTransferResponse['status']> = {
      'SUCCESSFUL': 'successful',
      'SUCCESS':    'successful',
      'NEW':        'pending',
      'PENDING':    'pending',
      'PROCESSING': 'pending',
      'FAILED':     'failed',
      'REVERSED':   'reversed',
    };
    return map[flwStatus.toUpperCase()] ?? 'failed';
  }

  private extractError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const d = error.response?.data as Record<string, unknown> | undefined;
      return (d?.['message'] as string) ?? error.message;
    }
    return 'Unknown Flutterwave error';
  }
}