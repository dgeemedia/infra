// apps/api/src/modules/admin/admin.controller.ts
import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';

import { Public }        from '../../common/decorators/public.decorator';
import { AdminGuard }    from '../../common/guards/admin.guard';
import { AdminService }  from './admin.service';
import { PrismaService } from '../../database/prisma.service';

// ── Balance top-up DTO ────────────────────────────────────────
class TopUpDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  amountPence!: number;

  @IsString()
  @Length(5, 200)
  description!: string;
}

@Public()
@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('v1/admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma:       PrismaService,
  ) {}

  // ── Platform stats ────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide stats' })
  async getStats() {
    const [stats, flwBalance] = await Promise.all([
      this.adminService.getPlatformStats(),
      this.adminService.getFlutterwaveBalance(),
    ]);
    return { ...stats, flutterwaveBalance: flwBalance };
  }

  // ── Partners ──────────────────────────────────────────────
  @Get('partners')
  @ApiOperation({ summary: 'List all partners with metrics + balances' })
  async getAllPartners() {
    return this.adminService.getAllPartners();
  }

  @Get('partners/:id')
  @ApiOperation({ summary: 'Get single partner detail' })
  async getPartnerDetail(@Param('id') id: string) {
    return this.adminService.getPartnerDetail(id);
  }

  @Patch('partners/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a partner account' })
  async suspendPartner(@Param('id') id: string) {
    return this.adminService.suspendPartner(id);
  }

  @Patch('partners/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivate a partner account' })
  async activatePartner(@Param('id') id: string) {
    return this.adminService.activatePartner(id);
  }

  // ── Partner balances ──────────────────────────────────────
  @Get('balances')
  @ApiOperation({ summary: 'All partner balances + Flutterwave wallet' })
  async getAllBalances() {
    const [partnerBalances, flwBalance] = await Promise.all([
      this.adminService.getAllPartnerBalances(),
      this.adminService.getFlutterwaveBalance(),
    ]);
    return { ...partnerBalances, flutterwaveBalance: flwBalance };
  }

  // ── Balance top-up ────────────────────────────────────────
  @Post('partners/:id/balance/topup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Credit a partner balance after confirming receipt' })
  async topUpBalance(
    @Param('id') id:  string,
    @Body()      dto: TopUpDto,
  ) {
    const partner = await this.prisma.partner.findUnique({
      where: { id }, select: { id: true, name: true, balancePence: true },
    });
    if (!partner) throw new Error('Partner not found');

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
      partnerId:       id,
      name:            partner.name,
      creditedPence:   dto.amountPence,
      creditedGbp:     (dto.amountPence / 100).toFixed(2),
      newBalancePence: balanceAfterPence,
      newBalanceGbp:   (balanceAfterPence / 100).toFixed(2),
    };
  }

  // ── Balance ledger ────────────────────────────────────────
  @Get('partners/:id/balance/ledger')
  @ApiOperation({ summary: 'Balance ledger for a partner' })
  async getBalanceLedger(
    @Param('id')       id:        string,
    @Query('page')     page?:     string,
    @Query('pageSize') pageSize?: string,
    @Query('type')     type?:     string,
  ) {
    const p    = page     ? parseInt(page)     : 1;
    const ps   = pageSize ? parseInt(pageSize) : 20;
    const skip = (p - 1) * ps;

    const where: Record<string, unknown> = { partnerId: id };
    if (type) where['type'] = type;

    const [entries, total] = await Promise.all([
      this.prisma.balanceTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take:    ps,
        include: { payout: { select: { partnerReference: true } } },
      }),
      this.prisma.balanceTransaction.count({ where }),
    ]);

    return {
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
      page:       p,
      pageSize:   ps,
      totalPages: Math.ceil(total / ps),
    };
  }

  // ── Receiving account ─────────────────────────────────────
  @Get('receiving-account')
  @ApiOperation({ summary: 'Your receiving account details (from .env)' })
  getReceivingAccount() {
    return this.adminService.getReceivingAccountDetails();
  }

  // ── Transactions ──────────────────────────────────────────
  @Get('transactions')
  @ApiOperation({ summary: 'All transactions across all partners' })
  async getAllTransactions(
    @Query('page')      page?:      string,
    @Query('pageSize')  pageSize?:  string,
    @Query('status')    status?:    string,
    @Query('partnerId') partnerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate')   endDate?:   string,
  ) {
    return this.adminService.getAllTransactions({
      page:      page      ? parseInt(page)     : 1,
      pageSize:  pageSize  ? parseInt(pageSize) : 20,
      status, partnerId, startDate, endDate,
    });
  }

  // ── Flagged payouts ───────────────────────────────────────
  @Get('flagged')
  @ApiOperation({ summary: 'All flagged payouts needing review' })
  async getFlagged() {
    return this.adminService.getFlaggedPayouts();
  }

  @Patch('flagged/:id/release')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Release flagged payout to processing' })
  async releaseFlagged(@Param('id') id: string) {
    return this.adminService.releaseFlaggedPayout(id);
  }

  @Patch('flagged/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject flagged payout as failed' })
  async rejectFlagged(@Param('id') id: string) {
    return this.adminService.rejectFlaggedPayout(id);
  }

  // ── Inbox ─────────────────────────────────────────────────
  @Get('inbox')
  @ApiOperation({ summary: 'Admin inbox — partner interest submissions' })
  async getInbox(
    @Query('page')     page?:     string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.getInboxMessages(
      page     ? parseInt(page)     : 1,
      pageSize ? parseInt(pageSize) : 20,
    );
  }
}