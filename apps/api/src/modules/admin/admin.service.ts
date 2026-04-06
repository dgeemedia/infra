// apps/api/src/modules/admin/admin.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService }   from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';

// ── Country → currency mapping ────────────────────────────────
// Partners pay Elorge in THEIR local currency. A UK partner sends
// GBP; a US partner sends USD. The balance is stored in minor units
// (pence/cents) of that currency. Display formatting is done here.
const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string; name: string }> = {
  GB: { code: 'GBP', symbol: '£', name: 'British Pound'  },
  US: { code: 'USD', symbol: '$', name: 'US Dollar'       },
  CA: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar'},
  AU: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  EU: { code: 'EUR', symbol: '€', name: 'Euro'            },
  DE: { code: 'EUR', symbol: '€', name: 'Euro'            },
  FR: { code: 'EUR', symbol: '€', name: 'Euro'            },
  NG: { code: 'NGN', symbol: '₦', name: 'Nigerian Naira'  },
  GH: { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi'},
  KE: { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling'},
  ZA: { code: 'ZAR', symbol: 'R',  name: 'South African Rand'},
};

function getCurrency(country: string) {
  return COUNTRY_CURRENCY[country] ?? { code: 'GBP', symbol: '£', name: 'British Pound' };
}

function formatBalance(pence: number, country: string): string {
  const cur = getCurrency(country);
  const amount = pence / 100;
  return `${cur.symbol}${amount.toFixed(2)}`;
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
      this.prisma.payout.count({ where: { status: 'FAILED' } }),
      this.prisma.payout.count({ where: { status: 'FLAGGED' } }),
      this.prisma.payout.aggregate({
        _sum: { nairaAmount: true },
        where: { status: 'DELIVERED' },
      }),
      this.prisma.payout.aggregate({ _sum: { fee: true } }),
    ]);

    const successRate = totalPayouts > 0
      ? parseFloat(((deliveredPayouts / totalPayouts) * 100).toFixed(1))
      : 0;

    return {
      totalPartners, activePartners, totalPayouts,
      deliveredPayouts, failedPayouts, flaggedPayouts, successRate,
      totalVolumeNaira:   Number(volumeResult._sum.nairaAmount ?? 0),
      totalFeesCollected: Number(feeResult._sum.fee ?? 0),
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
      by:     ['partnerId'],
      _sum:   { nairaAmount: true },
      _count: { id: true },
      where:  { status: 'DELIVERED' },
    });

    const volumeMap = new Map(
      volumeByPartner.map((v) => [v.partnerId, {
        volume: Number(v._sum.nairaAmount ?? 0),
        count:  v._count.id,
      }]),
    );

    return partners.map((p) => {
      const currency = getCurrency(p.country);
      return {
        id:              p.id,
        name:            p.name,
        email:           p.email,
        country:         p.country,
        status:          p.status,
        createdAt:       p.createdAt,
        activeApiKeys:   p._count.apiKeys,
        totalPayouts:    p._count.payouts,
        activeWebhooks:  p._count.webhookConfigs,
        deliveredVolume: volumeMap.get(p.id)?.volume ?? 0,
        deliveredCount:  volumeMap.get(p.id)?.count  ?? 0,
        currency:        currency.code,
        currencySymbol:  currency.symbol,
        balancePence:    p.balancePence,
        balanceFormatted: formatBalance(p.balancePence, p.country),
      };
    });
  }

  // ── All partner balances (balance-view endpoint) ──────────
  async getAllPartnerBalances() {
    const partners = await this.prisma.partner.findMany({
      where:   { role: 'PARTNER' },
      orderBy: [{ country: 'asc' }, { name: 'asc' }], // sorted by country then name
      select: {
        id:           true,
        name:         true,
        email:        true,
        country:      true,
        status:       true,
        balancePence: true,
        // Last credit transaction for "last topped up" display
        balanceTransactions: {
          where:   { type: 'CREDIT' },
          orderBy: { createdAt: 'desc' },
          take:    1,
          select:  { createdAt: true, amountPence: true, description: true },
        },
      },
    });

    // Group by currency for summary totals
    const byCurrency: Record<string, number> = {};
    for (const p of partners) {
      const cur = getCurrency(p.country).code;
      byCurrency[cur] = (byCurrency[cur] ?? 0) + p.balancePence;
    }

    return {
      partners: partners.map((p) => {
        const currency = getCurrency(p.country);
        return {
          id:               p.id,
          name:             p.name,
          email:            p.email,
          country:          p.country,
          status:           p.status,
          currency:         currency.code,
          currencySymbol:   currency.symbol,
          balancePence:     p.balancePence,
          balanceFormatted: formatBalance(p.balancePence, p.country),
          lastTopUp:        p.balanceTransactions[0] ?? null,
        };
      }),
      // GBP total (for partners with GBP balance) + breakdown per currency
      currencyTotals: Object.entries(byCurrency).map(([code, pence]) => ({
        currency: code,
        pence,
        formatted: `${code} ${(pence / 100).toFixed(2)}`,
      })),
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
      return { currency: ngn.currency, available: ngn.available_balance, ledger: ngn.ledger_balance };
    } catch (err) {
      this.logger.error('Failed to fetch Flutterwave balance', err);
      return null;
    }
  }

  // ── Receiving account details (from env) ──────────────────
  getReceivingAccountDetails() {
    const ra = this.configService.get('receivingAccount') as Record<string, unknown> | undefined;
    if (!ra) return null;
    return {
      provider: ra['provider'] ?? 'Not configured',
      gbp: ra['gbp'],
      usd: ra['usd'],
      eur: ra['eur'],
      cad: ra['cad'],
    };
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

    const currency = getCurrency(partner.country);

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
      currency:         currency.code,
      currencySymbol:   currency.symbol,
      balanceFormatted: formatBalance(partner.balancePence, partner.country),
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
    page?: number; pageSize?: number; status?: string;
    partnerId?: string; startDate?: string; endDate?: string;
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
        where, skip, take: pageSize, orderBy: { createdAt: 'desc' },
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
  // Reads SYSTEM notifications addressed to admin — these are
  // created by the /v1/interest public endpoint when a prospect
  // submits the expression of interest form.
  async getInboxMessages(page = 1, pageSize = 20) {
    const admin = await this.prisma.partner.findFirst({
      where: { role: 'ADMIN' },
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