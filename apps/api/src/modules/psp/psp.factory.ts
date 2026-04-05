// apps/api/src/modules/psp/psp.factory.ts
import { Injectable, Logger } from '@nestjs/common';

import { BanklyAdapter }      from './bankly.adapter';
import { FlutterwaveAdapter } from './flutterwave.adapter';
import type {
  IPspAdapter,
  PspTransferRequest,
  PspTransferResponse,
} from './psp.interface';

/**
 * PSP Factory
 * ─────────────────────────────────────────────────────────────
 * Primary:  Flutterwave (CBN licensed, microfinance bank licence)
 * Fallover: Bankly      (activated automatically on FLW failure)
 *
 * Failover is transparent — callers get one IPspAdapter and never
 * know which PSP actually processed the transfer.
 */
@Injectable()
export class PspFactory {
  private readonly logger = new Logger(PspFactory.name);

  constructor(
    private readonly flutterwave: FlutterwaveAdapter,
    private readonly bankly:      BanklyAdapter,
  ) {}

  getAdapter(): IPspAdapter {
    return this.buildWithFailover(this.flutterwave, this.bankly);
  }

  // ── Wrap primary with automatic failover to secondary ─────
  private buildWithFailover(
    primary:   IPspAdapter,
    secondary: IPspAdapter,
  ): IPspAdapter {
    const logger = this.logger;

    return {
      // Transfer: try primary, fall to secondary on failure
      async transfer(req: PspTransferRequest): Promise<PspTransferResponse> {
        const primaryResult = await primary.transfer(req);

        if (primaryResult.success) return primaryResult;

        // Primary failed — attempt Bankly failover
        logger.warn(
          `[PSP] Flutterwave failed for ${req.reference} (${primaryResult.message ?? 'unknown'}) ` +
          `— failing over to Bankly`,
        );

        const falloverResult = await secondary.transfer(req);

        if (!falloverResult.success) {
          logger.error(
            `[PSP] Both PSPs failed for ${req.reference}. ` +
            `FLW: ${primaryResult.message} | Bankly: ${falloverResult.message}`,
          );
        } else {
          logger.log(`[PSP] Bankly failover succeeded for ${req.reference}`);
        }

        return falloverResult;
      },

      // Status: check primary PSP (Flutterwave) for status
      checkStatus: (ref) => primary.checkStatus(ref),

      // Balance: primary wallet balance
      getBalance: () => primary.getBalance(),

      // Account validation: Flutterwave first, Bankly if that fails
      async validateAccount(bankCode: string, accountNumber: string) {
        const result = await primary.validateAccount(bankCode, accountNumber);
        if (result.valid) return result;
        return secondary.validateAccount(bankCode, accountNumber);
      },
    };
  }
}