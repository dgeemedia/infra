// apps/api/src/modules/payouts/payouts.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Recipient ─────────────────────────────────────────────────
export class RecipientDto {
  @ApiProperty({ example: 'Chukwuemeka Obi' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: '058', description: 'CBN bank code (3–6 digits)' })
  @IsString()
  @Matches(/^\d{3,6}$/, { message: 'bankCode must be 3–6 digits' })
  bankCode!: string;

  @ApiProperty({ example: '0123456789', description: '10-digit NUBAN account number' })
  @IsString()
  @Length(10, 10, { message: 'accountNumber must be exactly 10 digits' })
  @Matches(/^\d{10}$/, { message: 'accountNumber must contain only digits' })
  accountNumber!: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\+234\d{10}$/, { message: 'phone must be +234XXXXXXXXXX' })
  phone?: string;
}

// ── Create Payout ─────────────────────────────────────────────
/**
 * Naira-pipe model
 * ─────────────────────────────────────────────────────────────
 * Partners handle FX entirely on their side and arrive here
 * with a final Naira amount to disburse. Elorge:
 *   1. Debits (nairaAmount + platform fee) from the partner's
 *      pre-funded Naira wallet.
 *   2. Transfers exactly nairaAmount to the recipient via
 *      Flutterwave.
 *   3. Retains the platform fee as revenue.
 *
 * exchangeRateAudit is optional and purely for the partner's
 * own reconciliation records — Elorge never reads it.
 */
export class CreatePayoutDto {
  @ApiProperty({
    example:     'FP_TXN_20260407_001',
    description: 'Unique reference per partner. Duplicate references are rejected (idempotency key).',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  partnerReference!: string;

  @ApiProperty({
    example:     25000000,
    description:
      'Amount to credit to the recipient\'s Nigerian bank account, in kobo. '
      + '₦250,000.00 → nairaAmountKobo: 25000000. '
      + 'Elorge delivers this exact amount — no deductions from the recipient side.',
  })
  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  @Min(100_00,        { message: 'nairaAmountKobo must be at least ₦100 (10000 kobo)' })
  @Max(50_000_000_00, { message: 'nairaAmountKobo cannot exceed ₦50,000,000 per payout' })
  @Type(() => Number)
  nairaAmountKobo!: number;

  @ApiPropertyOptional({
    example:     2050.45,
    description:
      'Your FX rate (optional). Stored for audit and reconciliation only. '
      + 'Elorge does not use this value in any calculation.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  @Type(() => Number)
  exchangeRateAudit?: number;

  @ApiProperty({ type: RecipientDto })
  recipient!: RecipientDto;

  @ApiPropertyOptional({
    example:     'Family support — April 2026',
    description: 'Description shown on recipient\'s bank statement (max 100 chars).',
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  narration?: string;
}

// ── List Payouts Query ────────────────────────────────────────
export class PayoutQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  @Type(() => Number)
  pageSize?: number = 20;

  @ApiPropertyOptional({ example: 'DELIVERED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'FP_TXN' })
  @IsOptional()
  @IsString()
  search?: string;
}