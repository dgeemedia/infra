// apps/api/src/modules/admin/admin.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService }  from '@nestjs/config';
import { HttpService }    from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService }  from '../../database/prisma.service';

// kobo → "₦1,234.56"
function koboToNaira(kobo: number): string {
  return new Intl.NumberFormat('en-NG', {
    style:    'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(kobo / 100);
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma:        PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService:   HttpService,
  ) {}

  // ── Platform-wide stats ───────────────────────────────────
  async getPlatformStats() {
    const [
      totalPartners,
      activePartners,
      totalPayouts,
      deliveredPayouts,
      failedPayouts,
      flaggedPayouts,
      volumeResult,
      feeResult,
    ] = await Promise.all([
      this.prisma.partner.count({ where: { role: 'PARTNER' } }),
      this.prisma.partner.count({ where: { role: 'PARTNER', status: 'ACTIVE' } }),
      this.prisma.payout.count(),
      this.prisma.payout.count({ where: { status: 'DELIVERED' } }),
      this.prisma.payout.count({ where: { status: 'FAILED'    } }),
      this.prisma.payout.count({ where: { status: 'FLAGGED'   } }),
      // Total naira delivered to recipients (kobo sum)
      this.prisma.payout.aggregate({
        _sum: { nairaAmountKobo: true },
        where: { status: 'DELIVERED' },
      }),
      // Total fees earned (kobo sum)
      this.prisma.payout.aggregate({
        _sum: { feeKobo: true },
        where: { status: 'DELIVERED' },
      }),
    ]);

    const successRate = totalPayouts > 0
      ? parseFloat(((deliveredPayouts / totalPayouts) * 100).toFixed(1))
      : 0;

    return {
      totalPartners,
      activePartners,
      totalPayouts,
      deliveredPayouts,
      failedPayouts,
      flaggedPayouts,
      successRate,
      totalVolumeKobo:      volumeResult._sum.nairaAmountKobo ?? 0,
      totalVolumeNaira:     koboToNaira(volumeResult._sum.nairaAmountKobo ?? 0),
      totalFeesKobo:        feeResult._sum.feeKobo ?? 0,
      totalFeesNaira:       koboToNaira(feeResult._sum.feeKobo ?? 0),
    };
  }

  // ── List all partners ─────────────────────────────────────
  async getAllPartners() {
    const partners = await this.prisma.partner.findMany({
      where:   { role: 'PARTNER' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            apiKeys:        { where: { revokedAt: null } },
            payouts:        true,
            webhookConfigs: { where: { isActive: true } },
          },
        },
      },
    });

    const volumeByPartner = await this.prisma.payout.groupBy({
      by:    ['partnerId'],
      _sum:  { nairaAmountKobo: true },
      _count: { id: true },
      where: { status: 'DELIVERED' },
    });

    const volumeMap = new Map(
      volumeByPartner.map((v) => [
        v.partnerId,
        { volumeKobo: v._sum.nairaAmountKobo ?? 0, count: v._count.id },
      ]),
    );

    return partners.map((p) => ({
      id:               p.id,
      name:             p.name,
      email:            p.email,
      country:          p.country,
      status:           p.status,
      createdAt:        p.createdAt,
      activeApiKeys:    p._count.apiKeys,
      totalPayouts:     p._count.payouts,
      activeWebhooks:   p._count.webhookConfigs,
      deliveredVolumeKobo:    volumeMap.get(p.id)?.volumeKobo ?? 0,
      deliveredVolumeNaira:   koboToNaira(volumeMap.get(p.id)?.volumeKobo ?? 0),
      deliveredCount:   volumeMap.get(p.id)?.count ?? 0,
      balanceKobo:      p.balanceKobo,
      balanceNaira:     koboToNaira(p.balanceKobo),
    }));
  }

  // ── All partner balances ──────────────────────────────────
  async getAllPartnerBalances() {
    const partners = await this.prisma.partner.findMany({
      where:   { role: 'PARTNER' },
      orderBy: [{ name: 'asc' }],
      select: {
        id:          true,
        name:        true,
        email:       true,
        country:     true,
        status:      true,
        balanceKobo: true,
        balanceTransactions: {
          where:   { type: 'CREDIT' },
          orderBy: { createdAt: 'desc' },
          take:    1,
          select:  { createdAt: true, amountKobo: true, description: true },
        },
      },
    });

    const totalKobo = partners.reduce((sum, p) => sum + p.balanceKobo, 0);

    return {
      partners: partners.map((p) => ({
        id:           p.id,
        name:         p.name,
        email:        p.email,
        country:      p.country,
        status:       p.status,
        balanceKobo:  p.balanceKobo,
        balanceNaira: koboToNaira(p.balanceKobo),
        lastTopUp:    p.balanceTransactions[0] ?? null,
      })),
      totalKobo,
      totalNaira: koboToNaira(totalKobo),
    };
  }

  // ── Flutterwave NGN wallet balance ────────────────────────
  async getFlutterwaveBalance(): Promise<{
    currency: string; available: number; ledger: number;
  } | null> {
    const secretKey = this.configService.get<string>('psp.flutterwave.secretKey');
    const baseUrl   = this.configService.get<string>('psp.flutterwave.baseUrl')
                      ?? 'https://api.flutterwave.com/v3';

    if (!secretKey) {
      this.logger.warn('FLUTTERWAVE_SECRET_KEY not configured — skipping balance fetch');
      return null;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<{
          status: string;
          data:   Array<{ currency: string; available_balance: number; ledger_balance: number }>;
        }>(
          `${baseUrl}/balances/NGN`,
          { headers: { Authorization: `Bearer ${secretKey}` } },
        ),
      );
      const ngn = response.data?.data?.[0];
      if (!ngn) return null;
      return {
        currency:  ngn.currency,
        available: ngn.available_balance,
        ledger:    ngn.ledger_balance,
      };
    } catch (err) {
      this.logger.error('Failed to fetch Flutterwave balance', err);
      return null;
    }
  }

  // ── Get single partner detail ─────────────────────────────
  async getPartnerDetail(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where:   { id },
      include: {
        apiKeys:        { where: { revokedAt: null }, orderBy: { createdAt: 'desc' } },
        webhookConfigs: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!partner) throw new NotFoundException('Partner not found');

    const [payoutStats, recentPayouts, recentLedger] = await Promise.all([
      this.prisma.payout.groupBy({
        by:     ['status'],
        _count: { id: true },
        where:  { partnerId: id },
      }),
      this.prisma.payout.findMany({
        where:   { partnerId: id },
        orderBy: { createdAt: 'desc' },
        take:    10,
        include: { recipient: true },
      }),
      this.prisma.balanceTransaction.findMany({
        where:   { partnerId: id },
        orderBy: { createdAt: 'desc' },
        take:    5,
      }),
    ]);

    return {
      ...partner,
      balanceNaira: koboToNaira(partner.balanceKobo),
      payoutStats,
      recentPayouts,
      recentLedger,
    };
  }

  // ── Suspend / activate ────────────────────────────────────
  async suspendPartner(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Partner not found');
    return this.prisma.partner.update({ where: { id }, data: { status: 'SUSPENDED' } });
  }

  async activatePartner(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Partner not found');
    return this.prisma.partner.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  // ── All transactions ──────────────────────────────────────
  async getAllTransactions(filters: {
    page?:       number;
    pageSize?:   number;
    status?:     string;
    partnerId?:  string;
    startDate?:  string;
    endDate?:    string;
  }) {
    const page     = filters.page     ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip     = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (filters.status)    where['status']    = filters.status;
    if (filters.partnerId) where['partnerId'] = filters.partnerId;
    if (filters.startDate || filters.endDate) {
      where['createdAt'] = {
        ...(filters.startDate ? { gte: new Date(filters.startDate) } : {}),
        ...(filters.endDate   ? { lte: new Date(filters.endDate)   } : {}),
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        skip,
        take:    pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          recipient: true,
          partner:   { select: { id: true, name: true, email: true, country: true } },
        },
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { data, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ── Flagged payouts ───────────────────────────────────────
  async getFlaggedPayouts() {
    return this.prisma.payout.findMany({
      where:   { status: 'FLAGGED' },
      orderBy: { createdAt: 'desc' },
      include: {
        recipient: true,
        partner:   { select: { id: true, name: true, email: true } },
      },
    });
  }

  async releaseFlaggedPayout(id: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout)                     throw new NotFoundException('Payout not found');
    if (payout.status !== 'FLAGGED') return payout;
    return this.prisma.payout.update({ where: { id }, data: { status: 'PROCESSING' } });
  }

  async rejectFlaggedPayout(id: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout)                     throw new NotFoundException('Payout not found');
    if (payout.status !== 'FLAGGED') return payout;
    return this.prisma.payout.update({
      where: { id },
      data:  { status: 'FAILED', failureReason: 'Rejected by Elorge compliance team' },
    });
  }

  // ── Inbox: partner interest submissions ───────────────────
  async getInboxMessages(page = 1, pageSize = 20) {
    const admin = await this.prisma.partner.findFirst({
      where:  { role: 'ADMIN' },
      select: { id: true },
    });
    if (!admin) return { messages: [], total: 0, page, pageSize, totalPages: 0 };

    const where = { partnerId: admin.id, type: 'SYSTEM' as const };
    const [messages, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * pageSize,
        take:    pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { messages, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }
}