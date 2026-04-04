// apps/api/src/modules/payouts/payouts.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

  @ApiProperty({ example: '058', description: 'CBN bank code' })
  @IsString()
  @Matches(/^\d{3,6}$/, { message: 'bankCode must be 3-6 digits' })
  bankCode!: string;

  @ApiProperty({ example: '0123456789', description: '10-digit NUBAN account number' })
  @IsString()
  @Length(10, 10, { message: 'accountNumber must be exactly 10 digits' })
  @Matches(/^\d{10}$/, { message: 'accountNumber must contain only digits' })
  accountNumber!: string;

  @ApiPropertyOptional({ example: '+2348012345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\+234\d{10}$/, { message: 'phone must be a valid Nigerian number: +234XXXXXXXXXX' })
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
export class CreatePayoutDto {
  @ApiProperty({
    example:     'FP_TXN_20260327_001',
    description: 'Your unique reference for this transaction — must be unique per partner',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  partnerReference!: string;

  @ApiProperty({ example: 100, description: 'Amount to send in the specified currency' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1,    { message: 'sendAmount must be at least 1' })
  @Max(5000, { message: 'sendAmount cannot exceed 5000' })
  @Type(() => Number)
  sendAmount!: number;

  @ApiProperty({ enum: Currency, example: Currency.GBP })
  @IsEnum(Currency)
  sendCurrency!: Currency;

  @ApiProperty({ type: RecipientDto })
  recipient!: RecipientDto;

  @ApiProperty({ type: SenderDto })
  sender!: SenderDto;

  @ApiPropertyOptional({
    example:     'Family support — March 2026',
    description: 'Optional description shown on recipient bank statement',
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
