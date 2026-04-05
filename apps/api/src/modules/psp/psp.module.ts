// apps/api/src/modules/psp/psp.module.ts
import { Module }             from '@nestjs/common';
import { BanklyAdapter }      from './bankly.adapter';
import { FlutterwaveAdapter } from './flutterwave.adapter';
import { PspFactory }         from './psp.factory';

@Module({
  providers: [
    FlutterwaveAdapter,   // ← PRIMARY
    BanklyAdapter,        // ← FALLOVER
    PspFactory,
  ],
  exports: [PspFactory],
})
export class PspModule {}