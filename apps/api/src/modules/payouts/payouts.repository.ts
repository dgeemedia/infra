import { Injectable } from '@nestjs/common';
import { PrismaClient, Payout, Prisma } from '@prisma/client';

import { PayoutStatus } from '@elorge/constants';

const prisma = new PrismaClient();

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

  // ── Create a new payout record ────────────────────────────
  async create(data: {
    partnerId:        string;
    partnerReference: string;
    sendAmount:       number;
    sendCurrency:     string;
    nairaAmount:      number;
    exchangeRate:     number;
    fee:              number;
    narration?:       string;
    recipient: {
      fullName:      string;
      bankCode:      string;
      bankName:      string;
      accountNumber: string;
      phone?:        string;
    };
  }): Promise<PayoutWithRecipient> {
    return prisma.payout.create({
      data: {
        partnerId:        data.partnerId,
        partnerReference: data.partnerReference,
        sendAmount:       data.sendAmount,
        sendCurrency:     data.sendCurrency,
        nairaAmount:      data.nairaAmount,
        exchangeRate:     data.exchangeRate,
        fee:              data.fee,
        narration:        data.narration,
        status:           'PENDING',
        recipient: {
          create: {
            fullName:      data.recipient.fullName,
            bankCode:      data.recipient.bankCode,
            bankName:      data.recipient.bankName,
            accountNumber: data.recipient.accountNumber,
            phone:         data.recipient.phone,
          },
        },
      },
      include: { recipient: true },
    });
  }

  // ── Find by Elorge payout ID ──────────────────────────────
  async findById(id: string): Promise<PayoutWithRecipient | null> {
    return prisma.payout.findUnique({
      where:   { id },
      include: { recipient: true },
    });
  }

  // ── Find by partner + partnerReference (duplicate check) ──
  async findByReference(
    partnerId:        string,
    partnerReference: string,
  ): Promise<Payout | null> {
    return prisma.payout.findUnique({
      where: { partnerId_partnerReference: { partnerId, partnerReference } },
    });
  }

  // ── Update status ─────────────────────────────────────────
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
    return prisma.payout.update({
      where: { id },
      data: {
        status,
        ...extra,
        ...(status === PayoutStatus.DELIVERED ? { deliveredAt: new Date() } : {}),
      },
    });
  }

  // ── List payouts for a partner (paginated) ────────────────
  async findMany(params: {
    partnerId: string;
    page:      number;
    pageSize:  number;
    status?:   string;
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
      prisma.payout.findMany({
        where,
        include:  { recipient: true },
        orderBy:  { createdAt: 'desc' },
        skip:     (params.page - 1) * params.pageSize,
        take:     params.pageSize,
      }),
      prisma.payout.count({ where }),
    ]);

    return { data, total };
  }

  // ── Stats for dashboard overview ──────────────────────────
  async getStats(partnerId: string): Promise<{
    totalPayouts:      number;
    successfulPayouts: number;
    failedPayouts:     number;
    todayPayouts:      number;
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [total, successful, failed, today] = await Promise.all([
      prisma.payout.count({ where: { partnerId } }),
      prisma.payout.count({ where: { partnerId, status: 'DELIVERED' } }),
      prisma.payout.count({ where: { partnerId, status: 'FAILED' } }),
      prisma.payout.count({ where: { partnerId, createdAt: { gte: todayStart } } }),
    ]);

    return {
      totalPayouts:      total,
      successfulPayouts: successful,
      failedPayouts:     failed,
      todayPayouts:      today,
    };
  }
}
