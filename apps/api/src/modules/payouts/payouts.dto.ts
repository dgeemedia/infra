// apps/api/src/modules/payouts/payouts.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt, IsNotEmpty, IsNumber, IsOptional,
  IsPositive, IsString, Length, Matches, Max, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ── Recipient ─────────────────────────────────────────────────
export class RecipientDto {
  @ApiProperty({ example: 'Chukwuemeka Obi' })
  @IsString() @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: '058', description: 'CBN bank code (3–6 digits)' })
  @IsString()
  @Matches(/^\d{3,6}$/, { message: 'bankCode must be 3–6 digits' })
  bankCode!: string;

  @ApiProperty({ example: '0123456789', description: '10-digit NUBAN' })
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
 * Naira-pipe model — partner owns FX entirely
 * ─────────────────────────────────────────────────────────────
 *
 * Partners convert their foreign currency to NGN using their own
 * FX engine and send Elorge the final naira amount in kobo.
 *
 * Elorge:
 *   1. Checks partner's wallet ≥ (nairaAmountKobo + Elorge fee)
 *   2. Debits the full amount from the partner wallet
 *   3. Sends exactly nairaAmountKobo to the recipient via Flutterwave
 *   4. Retains the fee as platform revenue
 *
 * WHY KOBO (INTEGER)?
 *   Integer arithmetic eliminates floating-point rounding errors in
 *   financial calculations. ₦250,000.00 → nairaAmountKobo: 25000000
 *
 * FEES (as of launch):
 *   ≤ ₦50,000     → ₦150  fee
 *   ≤ ₦200,000    → ₦250  fee
 *   ≤ ₦1,000,000  → ₦400  fee
 *   > ₦1,000,000  → ₦600  fee
 *   Flutterwave charges Elorge ~₦27. Elorge profit = fee - ₦27.
 */
export class CreatePayoutDto {
  @ApiProperty({
    example:     'FP_TXN_20260407_001',
    description: 'Unique reference per partner. Used as idempotency key. Duplicates are rejected.',
  })
  @IsString() @IsNotEmpty() @Length(1, 100)
  partnerReference!: string;

  @ApiProperty({
    example:     25000000,
    description:
      'Amount to credit to the Nigerian recipient, in KOBO (1 NGN = 100 kobo). ' +
      '₦250,000.00 → nairaAmountKobo: 25000000. ' +
      'Elorge delivers this exact amount. ' +
      'The platform fee is charged separately from your wallet.',
  })
  @IsInt()
  @IsPositive()
  @Min(10_000,        { message: 'nairaAmountKobo must be at least ₦100 (10000 kobo)' })
  @Max(5_000_000_000, { message: 'nairaAmountKobo cannot exceed ₦50,000,000 per payout (5000000000 kobo)' })
  @Type(() => Number)
  nairaAmountKobo!: number;

  @ApiPropertyOptional({
    example:     2050.45,
    description:
      'Your FX rate (optional). Stored for your audit trail and reconciliation. ' +
      'Elorge never uses this value in any calculation.',
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
    description: 'Description on recipient\'s bank statement (max 100 chars).',
  })
  @IsOptional() @IsString() @Length(0, 100)
  narration?: string;
}

// ── List Payouts Query ────────────────────────────────────────
export class PayoutQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional() @IsInt() @Min(1) @Max(500) @Type(() => Number)
  pageSize?: number = 20;

  @ApiPropertyOptional({ example: 'DELIVERED' })
  @IsOptional() @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional() @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional() @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'FP_TXN' })
  @IsOptional() @IsString()
  search?: string;
}