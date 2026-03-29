import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { BanklyAdapter }      from './bankly.adapter';
import type { IPspAdapter }   from './psp.interface';

/**
 * PSP Factory — returns the correct adapter based on config.
 * Primary:  Bankly
 * Fallback: Flutterwave (add FlutterwaveAdapter when ready)
 *
 * To switch PSP: change PSP_PROVIDER env var — no code changes needed.
 */
@Injectable()
export class PspFactory {
  constructor(
    private readonly config:  ConfigService,
    private readonly bankly:  BanklyAdapter,
  ) {}

  getAdapter(): IPspAdapter {
    const provider = this.config.get<string>('PSP_PROVIDER') ?? 'bankly';

    switch (provider.toLowerCase()) {
      case 'bankly':
        return this.bankly;
      // case 'flutterwave':
      //   return this.flutterwave;
      default:
        return this.bankly;
    }
  }
}
