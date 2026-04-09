// apps/api/src/modules/admin/balance.controller.ts
//
// Admin-only endpoints for managing partner Naira wallet balances.

import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsEnum, IsInt, IsOptional, IsPositive, IsString, Length, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import { PrismaService } from '../../database/prisma.service';
import { AdminGuard }    from '../../common/guards/admin.guard';

// ── DTOs ──────────────────────────────────────────────────────

class TopUpDto {
  // Amount in kobo (₦500.00 → 50000 kobo). Integer avoids float drift.
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  amountKobo!: number;

  // Human note for the ledger, e.g. "NGN transfer REF-12345 confirmed 2026-04-05"
  @IsString()
  @Length(5, 200)
  description!: string;
}

class BalanceLedgerQueryDto {
  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  page?: number = 1;

  @IsOptional() @IsInt() @Min(1) @Type(() => Number)
  pageSize?: number = 20;

  @IsOptional()
  @IsEnum(['CREDIT', 'DEBIT', 'REFUND'])
  type?: 'CREDIT' | 'DEBIT' | 'REFUND';
}

// ── Controller ────────────────────────────────────────────────

@ApiTags('Admin — Balances')
@UseGuards(AdminGuard)
@Controller('v1/admin/partners/:id/balance')
export class BalanceController {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET current balance ───────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Get partner current Naira wallet balance' })
  async getBalance(@Param('id') id: string) {
    const partner = await this.prisma.partner.findUnique({
      where:  { id },
      select: { id: true, name: true, email: true, balanceKobo: true },
    });
    if (!partner) return { success: false, message: 'Partner not found' };

    return {
      success: true,
      data: {
        partnerId:    partner.id,
        name:         partner.name,
        email:        partner.email,
        balanceKobo:  partner.balanceKobo,
        balanceNaira: (partner.balanceKobo / 100).toFixed(2),
      },
    };
  }

  // ── POST top-up ───────────────────────────────────────────
  //
  // Workflow:
  //  1. Partner wires NGN to Elorge (via VAN auto-credit or manual transfer)
  //  2. Admin confirms receipt and calls this endpoint
  //  3. Partner's Naira wallet is credited; they can now create payouts
  @Post('topup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Credit a partner Naira wallet (admin confirms receipt)',
    description: 'amountKobo is in kobo (₦500.00 = 50000). ' +
                 'description should include the transfer reference for audit.',
  })
  async topUp(@Param('id') id: string, @Body() dto: TopUpDto) {
    const partner = await this.prisma.partner.findUnique({
      where:  { id },
      select: { id: true, name: true, balanceKobo: true },
    });
    if (!partner) return { success: false, message: 'Partner not found' };

    const balanceAfterKobo = partner.balanceKobo + dto.amountKobo;

    await this.prisma.$transaction([
      this.prisma.partner.update({
        where: { id },
        data:  { balanceKobo: { increment: dto.amountKobo } },
      }),
      this.prisma.balanceTransaction.create({
        data: {
          partnerId:        id,
          type:             'CREDIT',
          amountKobo:       dto.amountKobo,
          balanceAfterKobo,
          description:      dto.description,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        partnerId:       id,
        name:            partner.name,
        creditedKobo:    dto.amountKobo,
        creditedNaira:   (dto.amountKobo / 100).toFixed(2),
        newBalanceKobo:  balanceAfterKobo,
        newBalanceNaira: (balanceAfterKobo / 100).toFixed(2),
        description:     dto.description,
      },
    };
  }

  // ── GET ledger ────────────────────────────────────────────
  @Get('ledger')
  @ApiOperation({ summary: 'Get partner Naira wallet ledger (paginated)' })
  async getLedger(@Param('id') id: string, @Query() query: BalanceLedgerQueryDto) {
    const page     = query.page     ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where = {
      partnerId: id,
      ...(query.type ? { type: query.type } : {}),
    };

    const [entries, total] = await Promise.all([
      this.prisma.balanceTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
        include: { payout: { select: { partnerReference: true } } },
      }),
      this.prisma.balanceTransaction.count({ where }),
    ]);

    return {
      success: true,
      data: {
        entries: entries.map((e) => ({
          id:                e.id,
          type:              e.type,
          amountKobo:        e.amountKobo,
          amountNaira:       (e.amountKobo / 100).toFixed(2),
          balanceAfterKobo:  e.balanceAfterKobo,
          balanceAfterNaira: (e.balanceAfterKobo / 100).toFixed(2),
          description:       e.description,
          payoutReference:   e.payout?.partnerReference ?? null,
          createdAt:         e.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}