// apps/api/src/modules/payouts/payouts.repository.ts
import { Injectable } from '@nestjs/common';
import { Payout, Prisma } from '@prisma/client';
import { PayoutStatus } from '@elorge/constants';
import { PrismaService } from '../../database/prisma.service';

export type PayoutWithRecipient = Payout & {
  recipient: {
    fullName:      string;
    bankCode:      string;
    bankName:      string;
    accountNumber: string;
    phone:         string | null;
  } | null;
};

@Injectable()
export class PayoutsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    partnerId:         string;
    partnerReference:  string;
    nairaAmountKobo:   number;
    feeKobo:           number;
    exchangeRateAudit?: number;
    narration?:        string;
    recipient: {
      fullName:      string;
      bankCode:      string;
      bankName:      string;
      accountNumber: string;
      phone?:        string;
    };
  }): Promise<PayoutWithRecipient> {
    return this.prisma.payout.create({
      data: {
        partnerId:         data.partnerId,
        partnerReference:  data.partnerReference,
        nairaAmountKobo:   data.nairaAmountKobo,
        feeKobo:           data.feeKobo,
        exchangeRateAudit: data.exchangeRateAudit,
        narration:         data.narration,
        status:            'PENDING',
        recipient: { create: { ...data.recipient } },
      },
      include: { recipient: true },
    });
  }

  async findById(id: string): Promise<PayoutWithRecipient | null> {
    return this.prisma.payout.findUnique({
      where:   { id },
      include: { recipient: true },
    });
  }

  async findByReference(
    partnerId:        string,
    partnerReference: string,
  ): Promise<Payout | null> {
    return this.prisma.payout.findUnique({
      where: { partnerId_partnerReference: { partnerId, partnerReference } },
    });
  }

  async updateStatus(
    id:     string,
    status: PayoutStatus,
    extra?: {
      pspReference?:  string;
      failureReason?: string;
      bankSessionId?: string;
      deliveredAt?:   Date;
    },
  ): Promise<Payout> {
    return this.prisma.payout.update({
      where: { id },
      data: {
        status,
        ...extra,
        ...(status === PayoutStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
      },
    });
  }

  async findMany(params: {
    partnerId:  string;
    page:       number;
    pageSize:   number;
    status?:    string;
    startDate?: string;
    endDate?:   string;
    search?:    string;
  }): Promise<{ data: PayoutWithRecipient[]; total: number }> {
    const where: Prisma.PayoutWhereInput = {
      partnerId: params.partnerId,
      ...(params.status ? { status: params.status as PayoutStatus } : {}),
      ...(params.startDate || params.endDate
        ? {
            createdAt: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate   ? { lte: new Date(params.endDate)   } : {}),
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { partnerReference: { contains: params.search, mode: 'insensitive' } },
              { recipient: { fullName: { contains: params.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include:  { recipient: true },
        orderBy:  { createdAt: 'desc' },
        skip:     (params.page - 1) * params.pageSize,
        take:     params.pageSize,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return { data, total };
  }

  async getStats(partnerId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, successful, failed, today] = await Promise.all([
      this.prisma.payout.count({ where: { partnerId } }),
      this.prisma.payout.count({ where: { partnerId, status: 'DELIVERED' } }),
      this.prisma.payout.count({ where: { partnerId, status: 'FAILED'    } }),
      this.prisma.payout.count({ where: { partnerId, createdAt: { gte: todayStart } } }),
    ]);

    return {
      totalPayouts:      total,
      successfulPayouts: successful,
      failedPayouts:     failed,
      todayPayouts:      today,
    };
  }
}