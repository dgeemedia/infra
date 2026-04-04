// apps/api/src/modules/psp/psp.module.ts
import { Module }          from '@nestjs/common';
import { BanklyAdapter }   from './bankly.adapter';
import { PspFactory }      from './psp.factory';

@Module({
  providers: [BanklyAdapter, PspFactory],
  exports:   [PspFactory],
})
export class PspModule {}
