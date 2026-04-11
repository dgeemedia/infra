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
// amountKobo: Naira in kobo (₦500.00 → 50000 kobo)
// description: human note e.g. "Wise NGN transfer REF-12345 confirmed 2026-04-07"
class TopUpDto {
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  amountKobo!: number;

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
  @ApiOperation({ summary: 'All partner Naira balances + Flutterwave wallet' })
  async getAllBalances() {
    const [partnerBalances, flwBalance] = await Promise.all([
      this.adminService.getAllPartnerBalances(),
      this.adminService.getFlutterwaveBalance(),
    ]);
    return { ...partnerBalances, flutterwaveBalance: flwBalance };
  }

  // ── Balance top-up ────────────────────────────────────────
  // Workflow:
  //  1. Partner sends Naira (via local transfer / Wise NGN etc.) to your account
  //  2. You confirm receipt
  //  3. Call this endpoint → partner's Naira wallet is credited
  //  4. Partner can now create payouts up to their balance
  @Post('partners/:id/balance/topup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Credit a partner Naira wallet (admin confirms receipt)',
    description:
      'Call after confirming the partner\'s Naira transfer landed. '
      + 'amountKobo is in kobo (₦500.00 = 50000). '
      + 'description should include the transfer reference for audit.',
  })
  async topUpBalance(
    @Param('id') id:  string,
    @Body()      dto: TopUpDto,
  ) {
    const partner = await this.prisma.partner.findUnique({
      where:  { id },
      select: { id: true, name: true, balanceKobo: true },
    });
    if (!partner) throw new Error('Partner not found');

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
      partnerId:      id,
      name:           partner.name,
      creditedKobo:   dto.amountKobo,
      creditedNaira:  (dto.amountKobo / 100).toFixed(2),
      newBalanceKobo: balanceAfterKobo,
      newBalanceNaira:(balanceAfterKobo / 100).toFixed(2),
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
        id:               e.id,
        type:             e.type,
        amountKobo:       e.amountKobo,
        amountNaira:      (e.amountKobo / 100).toFixed(2),
        balanceAfterKobo: e.balanceAfterKobo,
        balanceAfterNaira:(e.balanceAfterKobo / 100).toFixed(2),
        description:      e.description,
        payoutReference:  e.payout?.partnerReference ?? null,
        createdAt:        e.createdAt.toISOString(),
      })),
      total,
      page:       p,
      pageSize:   ps,
      totalPages: Math.ceil(total / ps),
    };
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

// Add this endpoint inside AdminController class:
@Get('partners/:id/login-sessions')
@ApiOperation({ summary: 'Login history for a partner — IPs and devices' })
async getLoginSessions(
  @Param('id')       id:        string,
  @Query('page')     page?:     string,
  @Query('pageSize') pageSize?: string,
) {
  const p  = page     ? parseInt(page)     : 1;
  const ps = pageSize ? parseInt(pageSize) : 50;

  const [sessions, total] = await Promise.all([
    this.prisma.loginSession.findMany({
      where:   { partnerId: id },
      orderBy: { loggedInAt: 'desc' },
      skip:    (p - 1) * ps,
      take:    ps,
    }),
    this.prisma.loginSession.count({ where: { partnerId: id } }),
  ]);

  return {
    sessions,
    total,
    page:       p,
    pageSize:   ps,
    totalPages: Math.ceil(total / ps),
  };
}

// Also add a platform-wide endpoint — all sessions across all partners
@Get('login-sessions')
@ApiOperation({ summary: 'All login sessions across all partners' })
async getAllLoginSessions(
  @Query('page')      page?:      string,
  @Query('pageSize')  pageSize?:  string,
  @Query('partnerId') partnerId?: string,
  @Query('ipAddress') ipAddress?: string,
) {
  const p     = page     ? parseInt(page)     : 1;
  const ps    = pageSize ? parseInt(pageSize) : 50;

  const where: Record<string, unknown> = {};
  if (partnerId) where['partnerId'] = partnerId;
  if (ipAddress) where['ipAddress'] = { contains: ipAddress };

  const [sessions, total] = await Promise.all([
    this.prisma.loginSession.findMany({
      where,
      orderBy: { loggedInAt: 'desc' },
      skip:    (p - 1) * ps,
      take:    ps,
      include: {
        partner: { select: { id: true, name: true, email: true } },
      },
    }),
    this.prisma.loginSession.count({ where }),
  ]);

  return {
    sessions,
    total,
    page:       p,
    pageSize:   ps,
    totalPages: Math.ceil(total / ps),
  };
}

}

