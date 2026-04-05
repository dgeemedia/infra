// apps/api/src/modules/payouts/payouts.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
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

import { Currency } from '@elorge/constants';

// ── Nested: Recipient ─────────────────────────────────────
export class RecipientDto {
  @ApiProperty({ example: 'Chukwuemeka Obi' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: '058', description: 'CBN bank code (3-6 digits)' })
  @IsString()
  @Matches(/^\d{3,6}$/, { message: 'bankCode must be 3-6 digits' })
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

// ── Nested: Sender ────────────────────────────────────────
export class SenderDto {
  @ApiProperty({ example: 'David Okafor' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: 'GB', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  @Length(2, 2)
  country!: string;

  @ApiPropertyOptional({ example: 'USR_12345' })
  @IsOptional()
  @IsString()
  externalId?: string;
}

// ── Create Payout ─────────────────────────────────────────
/**
 * Transparent Fee Model (Option A)
 * ─────────────────────────────────────────────────────────
 * Partners handle their own FX conversion and provide the
 * final nairaAmount they want delivered to the recipient.
 * Elorge charges a separate, explicit platform fee per payout.
 *
 * Flow:
 *  1. Partner converts GBP → NGN using their own FX engine
 *  2. Partner sends { sendAmount, sendCurrency, nairaAmount }
 *  3. Elorge deducts its platform fee from the partner's
 *     account balance (invoiced separately / prefunded)
 *  4. Elorge delivers exactly nairaAmount to the recipient
 */
export class CreatePayoutDto {
  @ApiProperty({
    example:     'FP_TXN_20260327_001',
    description: 'Unique reference per partner. Duplicate references are rejected.',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  partnerReference!: string;

  // ── Sending side (for audit + platform fee calculation) ──

  @ApiProperty({
    example:     100,
    description: 'Amount in the sending currency. Used to calculate Elorge platform fee.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(50_000, { message: 'sendAmount cannot exceed 50,000' })
  @Type(() => Number)
  sendAmount!: number;

  @ApiProperty({
    enum:    Currency,
    example: Currency.GBP,
    description: 'Currency of the sending amount (GBP, USD, EUR, CAD).',
  })
  @IsEnum(Currency)
  sendCurrency!: Currency;

  // ── Receiving side (partner has already done FX) ─────────

  @ApiProperty({
    example:     205000,
    description:
      'Exact NGN amount to credit to the recipient\'s account. ' +
      'Your system calculates this using your own FX rate. ' +
      'Elorge delivers this exact amount — no deductions.',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(100, { message: 'nairaAmount must be at least ₦100' })
  @Max(50_000_000, { message: 'nairaAmount cannot exceed ₦50,000,000 per payout' })
  @Type(() => Number)
  nairaAmount!: number;

  @ApiPropertyOptional({
    example:     2050.45,
    description:
      'Your FX rate used (optional — for audit trail and reconciliation only). ' +
      'Elorge does not use this for calculations.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 6 })
  @IsPositive()
  @Type(() => Number)
  exchangeRate?: number;

  // ── Parties ───────────────────────────────────────────────

  @ApiProperty({ type: RecipientDto })
  recipient!: RecipientDto;

  @ApiProperty({ type: SenderDto })
  sender!: SenderDto;

  @ApiPropertyOptional({
    example:     'Family support — March 2026',
    description: 'Description shown on recipient\'s bank statement (max 100 chars).',
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  narration?: string;
}

// ── List Payouts Query ────────────────────────────────────
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
  @Max(100)
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