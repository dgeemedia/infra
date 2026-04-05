// apps/api/src/modules/compliance/compliance.module.ts
import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';

@Module({
  providers: [ComplianceService],
  exports:   [ComplianceService],
})
export class ComplianceModule {}
