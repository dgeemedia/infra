// apps/api/src/modules/admin/balance.controller.ts
//
// Admin-only endpoints for managing partner balances.
// Drop into AdminModule alongside the existing admin controllers.

import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, Post, Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsEnum, IsInt, IsOptional, IsPositive, IsString, Length, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

import { PrismaService }  from '../../database/prisma.service';
import { AdminGuard }     from '../../common/guards/admin.guard'; // your existing admin guard
import { UseGuards }      from '@nestjs/common';

// ── DTOs ──────────────────────────────────────────────────────

class TopUpDto {
  // Amount in GBP pence (integer). Sending £50.00 → amountPence: 5000.
  // Integer avoids float drift; easy to validate and audit.
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  amountPence!: number;

  // Human note for the ledger, e.g. "Wise transfer TW-REF-12345 received 2026-04-05"
  @IsString()
  @Length(5, 200)
  description!: string;
}

class BalanceLedgerQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
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
  @ApiOperation({ summary: 'Get partner current balance' })
  async getBalance(@Param('id') id: string) {
    const partner = await this.prisma.partner.findUnique({
      where:  { id },
      select: { id: true, name: true, email: true, balancePence: true },
    });
    if (!partner) return { success: false, message: 'Partner not found' };

    return {
      success: true,
      data: {
        partnerId:    partner.id,
        name:         partner.name,
        email:        partner.email,
        balancePence: partner.balancePence,
        balanceGbp:   (partner.balancePence / 100).toFixed(2),
      },
    };
  }

  // ── POST top-up — admin records an incoming Wise payment ──
  //
  // Workflow:
  //  1. Partner sends GBP (or USD/EUR converted) to your Wise account
  //  2. You confirm receipt in Wise dashboard
  //  3. You call this endpoint with amountPence + the Wise reference
  //  4. Partner's balance is credited; they can now create payouts
  //
  // This is a manual step by design — you confirm real money
  // arrived before crediting the partner. No auto-reconciliation
  // with Wise at this stage (can be added later via Wise webhooks).
  @Post('topup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Credit a partner balance (admin records confirmed Wise receipt)',
    description:
      'Call after confirming the partner\'s Wise payment landed in your account. '
      + 'amountPence is in GBP pence (£50.00 = 5000). '
      + 'description should include the Wise payment reference for audit.',
  })
  async topUp(
    @Param('id') id:  string,
    @Body()      dto: TopUpDto,
  ) {
    const partner = await this.prisma.partner.findUnique({
      where:  { id },
      select: { id: true, name: true, balancePence: true },
    });
    if (!partner) return { success: false, message: 'Partner not found' };

    const balanceAfterPence = partner.balancePence + dto.amountPence;

    await this.prisma.$transaction([
      this.prisma.partner.update({
        where: { id },
        data:  { balancePence: { increment: dto.amountPence } },
      }),
      this.prisma.balanceTransaction.create({
        data: {
          partnerId:         id,
          type:              'CREDIT',
          amountPence:       dto.amountPence,
          balanceAfterPence,
          description:       dto.description,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        partnerId:         id,
        creditedPence:     dto.amountPence,
        creditedGbp:       (dto.amountPence / 100).toFixed(2),
        newBalancePence:   balanceAfterPence,
        newBalanceGbp:     (balanceAfterPence / 100).toFixed(2),
        description:       dto.description,
      },
    };
  }

  // ── GET ledger — full credit/debit history for a partner ──
  @Get('ledger')
  @ApiOperation({ summary: 'Get partner balance ledger (paginated)' })
  async getLedger(
    @Param('id') id:    string,
    @Query()     query: BalanceLedgerQueryDto,
  ) {
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
          amountPence:       e.amountPence,
          amountGbp:         (e.amountPence / 100).toFixed(2),
          balanceAfterPence: e.balanceAfterPence,
          balanceAfterGbp:   (e.balanceAfterPence / 100).toFixed(2),
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