// apps/api/src/modules/admin/admin.service.ts
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly prisma: PrismaService) {}

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
      this.prisma.payout.aggregate({
        _sum: { fee: true },
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
      totalVolumeNaira:   Number(volumeResult._sum.nairaAmount ?? 0),
      totalFeesCollected: Number(feeResult._sum.fee ?? 0),
    };
  }

  // ── List all partners with their metrics ──────────────────
  async getAllPartners() {
    const partners = await this.prisma.partner.findMany({
      where:   { role: 'PARTNER' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            apiKeys:  { where: { revokedAt: null } },
            payouts:  true,
            webhookConfigs: { where: { isActive: true } },
          },
        },
      },
    });

    const volumeByPartner = await this.prisma.payout.groupBy({
      by:    ['partnerId'],
      _sum:  { nairaAmount: true },
      _count: { id: true },
      where: { status: 'DELIVERED' },
    });

    const volumeMap = new Map(
      volumeByPartner.map((v) => [v.partnerId, {
        volume: Number(v._sum.nairaAmount ?? 0),
        count:  v._count.id,
      }])
    );

    return partners.map((p) => ({
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
    }));
  }

  // ── Get single partner detail ─────────────────────────────
  async getPartnerDetail(id: string) {
    const partner = await this.prisma.partner.findUnique({
      where:   { id },
      include: {
        apiKeys:       { where: { revokedAt: null }, orderBy: { createdAt: 'desc' } },
        webhookConfigs: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!partner) throw new NotFoundException('Partner not found');

    const payoutStats = await this.prisma.payout.groupBy({
      by:    ['status'],
      _count: { id: true },
      where: { partnerId: id },
    });

    const recentPayouts = await this.prisma.payout.findMany({
      where:   { partnerId: id },
      orderBy: { createdAt: 'desc' },
      take:    10,
      include: { recipient: true },
    });

    return { ...partner, payoutStats, recentPayouts };
  }

  // ── Suspend a partner ─────────────────────────────────────
  async suspendPartner(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Partner not found');

    return this.prisma.partner.update({
      where: { id },
      data:  { status: 'SUSPENDED' },
    });
  }

  // ── Reactivate a partner ──────────────────────────────────
  async activatePartner(id: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id } });
    if (!partner) throw new NotFoundException('Partner not found');

    return this.prisma.partner.update({
      where: { id },
      data:  { status: 'ACTIVE' },
    });
  }

  // ── All transactions across all partners ──────────────────
  async getAllTransactions(filters: {
    page?:      number;
    pageSize?:  number;
    status?:    string;
    partnerId?: string;
    startDate?: string;
    endDate?:   string;
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
          partner:   { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // ── Flagged payouts queue ─────────────────────────────────
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

  // ── Release a flagged payout → PROCESSING ─────────────────
  async releaseFlaggedPayout(id: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout)                    throw new NotFoundException('Payout not found');
    if (payout.status !== 'FLAGGED') return payout;

    return this.prisma.payout.update({
      where: { id },
      data:  { status: 'PROCESSING' },
    });
  }

  // ── Reject a flagged payout → FAILED ──────────────────────
  async rejectFlaggedPayout(id: string) {
    const payout = await this.prisma.payout.findUnique({ where: { id } });
    if (!payout)                    throw new NotFoundException('Payout not found');
    if (payout.status !== 'FLAGGED') return payout;

    return this.prisma.payout.update({
      where: { id },
      data:  { status: 'FAILED', failureReason: 'Rejected by Elorge compliance team' },
    });
  }
}