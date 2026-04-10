// apps/api/src/modules/payouts/payouts.service.ts
import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue }       from '@nestjs/bull';
import { ConfigService }     from '@nestjs/config';
import { NotificationType }  from '@prisma/client';
import { Queue }             from 'bull';

import { ERROR_CODES, PayoutStatus, getBankName, isValidBankCode } from '@elorge/constants';
import type { PayoutListResponse, PayoutResponse, PayoutStatusResponse } from '@elorge/types';

import { ComplianceService }               from '../compliance/compliance.service';
import { PspFactory }                      from '../psp/psp.factory';
import { CreatePayoutDto, PayoutQueryDto } from './payouts.dto';
import { PayoutsRepository }              from './payouts.repository';
import { PAYOUT_QUEUE }                   from '../../queues/payout.queue';
import { PrismaService }                  from '../../database/prisma.service';

// ── Fee schedule ──────────────────────────────────────────────
//
//  Tier thresholds and fees are in kobo (1 NGN = 100 kobo).
//  Flutterwave charges Elorge ~₦26.88 per transfer.
//  Elorge profit per payout = fee - ₦26.88.
//
//  ≤ ₦50,000     → ₦150  fee  (15,000 kobo)
//  ≤ ₦200,000    → ₦250  fee  (25,000 kobo)
//  ≤ ₦1,000,000  → ₦400  fee  (40,000 kobo)
//  > ₦1,000,000  → ₦600  fee  (60,000 kobo)
//
function calculateFeeKobo(nairaAmountKobo: number): number {
  const TIERS: Array<{ maxKobo: number; feeKobo: number }> = [
    { maxKobo: 5_000_000,   feeKobo: 15_000 },
    { maxKobo: 20_000_000,  feeKobo: 25_000 },
    { maxKobo: 100_000_000, feeKobo: 40_000 },
    { maxKobo: Infinity,    feeKobo: 60_000 },
  ];
  for (const tier of TIERS) {
    if (nairaAmountKobo <= tier.maxKobo) return tier.feeKobo;
  }
  return 60_000;
}

function koboToNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly repo:          PayoutsRepository,
    private readonly compliance:    ComplianceService,
    private readonly pspFactory:    PspFactory,
    private readonly prisma:        PrismaService,
    private readonly configService: ConfigService,
    @InjectQueue(PAYOUT_QUEUE) private readonly payoutQueue: Queue,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  CREATE PAYOUT — POST /v1/payouts
  // ══════════════════════════════════════════════════════════
  async create(partnerId: string, dto: CreatePayoutDto): Promise<PayoutResponse> {

    // ── 1. Validate bank code ─────────────────────────────
    if (!isValidBankCode(dto.recipient.bankCode)) {
      throw new BadRequestException({
        code:    ERROR_CODES.INVALID_BANK_CODE,
        message: `Bank code "${dto.recipient.bankCode}" is not a valid CBN-registered bank.`,
      });
    }

    // ── 2. Duplicate reference check ──────────────────────
    const existing = await this.repo.findByReference(partnerId, dto.partnerReference);
    if (existing) {
      throw new ConflictException({
        code:    ERROR_CODES.DUPLICATE_REFERENCE,
        message: `A payout with reference "${dto.partnerReference}" already exists.`,
      });
    }

    // ── 3. Calculate fee ──────────────────────────────────
    const nairaAmountKobo = dto.nairaAmountKobo;
    const feeKobo         = calculateFeeKobo(nairaAmountKobo);
    const totalDebitKobo  = nairaAmountKobo + feeKobo;

    // ── 4. Balance check ──────────────────────────────────
    const minBalanceKobo = this.configService.get<number>('app.minPartnerBalanceKobo') ?? 0;

    const partner = await this.prisma.partner.findUnique({
      where:  { id: partnerId },
      select: { balanceKobo: true, status: true, name: true },
    });

    if (!partner) {
      throw new NotFoundException({ code: ERROR_CODES.PARTNER_NOT_FOUND });
    }

    const balanceAfterKobo = partner.balanceKobo - totalDebitKobo;

    if (balanceAfterKobo < minBalanceKobo) {
      throw new HttpException(
        {
          code:        'INSUFFICIENT_BALANCE',
          message:
            `Insufficient Naira wallet balance. ` +
            `Required: ${koboToNaira(totalDebitKobo)} ` +
            `(${koboToNaira(nairaAmountKobo)} payout + ${koboToNaira(feeKobo)} fee). ` +
            `Available: ${koboToNaira(partner.balanceKobo)}. ` +
            `Fund your wallet by transferring Naira to your dedicated VAN.`,
          required:    totalDebitKobo,
          available:   partner.balanceKobo,
          fee:         feeKobo,
          nairaAmount: nairaAmountKobo,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // ── 5. Compliance screening ───────────────────────────
    this.logger.log(`Screening recipient: ${dto.recipient.fullName}`);
    const screening = await this.compliance.screenRecipient({
      fullName:      dto.recipient.fullName,
      accountNumber: dto.recipient.accountNumber,
      bankCode:      dto.recipient.bankCode,
    });

    // ── 6. Create payout + debit balance atomically ───────
    const bankName = getBankName(dto.recipient.bankCode);
    let payoutId   = '';

    await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.create({
        data: {
          partnerId:         partnerId,
          partnerReference:  dto.partnerReference,
          nairaAmountKobo,
          feeKobo,
          exchangeRateAudit: dto.exchangeRateAudit,
          narration:         dto.narration,
          status:            'PENDING',
          recipient: {
            create: {
              fullName:      dto.recipient.fullName,
              bankCode:      dto.recipient.bankCode,
              bankName,
              accountNumber: dto.recipient.accountNumber,
              phone:         dto.recipient.phone,
            },
          },
        },
      });

      payoutId = payout.id;

      await tx.partner.update({
        where: { id: partnerId },
        data:  { balanceKobo: { decrement: totalDebitKobo } },
      });

      await tx.balanceTransaction.create({
        data: {
          partnerId,
          type:             'DEBIT',
          amountKobo:       totalDebitKobo,
          balanceAfterKobo,
          description:
            `Payout ${payout.id} — ` +
            `${koboToNaira(nairaAmountKobo)} to ${dto.recipient.fullName} ` +
            `+ ${koboToNaira(feeKobo)} fee`,
          payoutId: payout.id,
        },
      });
    });

    // ── 7. Compliance hold or queue ───────────────────────
    if (screening.flagged) {
      await this.prisma.payout.update({
        where: { id: payoutId },
        data:  { status: 'FLAGGED', failureReason: screening.matchDetails ?? 'Sanctions match' },
      });
      this.logger.warn(`Payout ${payoutId} flagged: ${screening.matchDetails}`);
    } else {
      await this.payoutQueue.add(
        'dispatch',
        { payoutId },
        {
          attempts:         5,
          backoff:          { type: 'exponential', delay: 5_000 },
          jobId:            payoutId,
          removeOnComplete: true,
          removeOnFail:     false,
        },
      );
      this.logger.log(
        `Payout ${payoutId} queued — ` +
        `${koboToNaira(nairaAmountKobo)} → ${dto.recipient.accountNumber} ` +
        `(fee: ${koboToNaira(feeKobo)})`,
      );
    }

    // ── 8. Low balance warning ────────────────────────────
    const LOW_BALANCE_PAYOUTS = 20;
    const payoutsLeft = feeKobo > 0 ? Math.floor(balanceAfterKobo / feeKobo) : 0;
    if (payoutsLeft < LOW_BALANCE_PAYOUTS && payoutsLeft >= 0) {
      void this.sendLowBalanceAlert(partnerId, balanceAfterKobo, payoutsLeft);
    }

    const payout = await this.repo.findById(payoutId);
    return this.formatResponse(payout!, nairaAmountKobo, feeKobo);
  }

  // ── Low balance alert ─────────────────────────────────────
  private async sendLowBalanceAlert(
    partnerId:   string,
    balanceKobo: number,
    payoutsLeft: number,
  ): Promise<void> {
    try {
      const recent = await this.prisma.notification.findFirst({
        where: {
          partnerId,
          type:      NotificationType.BALANCE_LOW,
          createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
        },
      });
      if (recent) return;

      await this.prisma.notification.create({
        data: {
          partnerId,
          type:  NotificationType.BALANCE_LOW,
          title: `Low wallet balance — ${payoutsLeft} payouts remaining`,
          body:
            `Your Elorge wallet is running low (${koboToNaira(balanceKobo)}). ` +
            `At the current fee rate, you have approximately ${payoutsLeft} payouts left. ` +
            `Transfer Naira to your dedicated VAN to top up.`,
          read:     false,
          metadata: { balanceKobo, payoutsLeft },
        },
      });
    } catch (e) {
      this.logger.warn('Failed to send low balance alert', e);
    }
  }

  // ══════════════════════════════════════════════════════════
  //  DISPATCH — called by queue worker
  // ══════════════════════════════════════════════════════════
  async dispatch(payoutId: string): Promise<void> {
    const payout = await this.repo.findById(payoutId);

    if (!payout || !payout.recipient) {
      this.logger.error(`Dispatch: payout not found: ${payoutId}`);
      return;
    }

    if (payout.status !== PayoutStatus.PENDING) {
      this.logger.warn(`Dispatch: ${payoutId} already ${payout.status} — skipping`);
      return;
    }

    await this.repo.updateStatus(payoutId, PayoutStatus.PROCESSING);

    const psp    = this.pspFactory.getAdapter();
    const result = await psp.transfer({
      reference:     payoutId,
      amount:        payout.nairaAmountKobo / 100,
      bankCode:      payout.recipient.bankCode,
      accountNumber: payout.recipient.accountNumber,
      accountName:   payout.recipient.fullName,
      narration:     payout.narration ?? `Elorge payout ${payoutId}`,
    });

    if (result.success && result.status === 'successful') {
      await this.repo.updateStatus(payoutId, PayoutStatus.DELIVERED, {
        pspReference:  result.pspReference,
        bankSessionId: result.bankSession,
        deliveredAt:   new Date(),
      });
      this.logger.log(
        `Payout ${payoutId} DELIVERED — ` +
        `${koboToNaira(payout.nairaAmountKobo)} via PSP ref ${result.pspReference}`,
      );
    } else {
      const feeKobo = payout.feeKobo;
      if (feeKobo > 0) {
        await this.prisma.$transaction(async (tx) => {
          const updated = await tx.partner.update({
            where:  { id: payout.partnerId },
            data:   { balanceKobo: { increment: feeKobo } },
            select: { balanceKobo: true },
          });
          await tx.balanceTransaction.create({
            data: {
              partnerId:        payout.partnerId,
              type:             'REFUND',
              amountKobo:       feeKobo,
              balanceAfterKobo: updated.balanceKobo,
              description:      `Fee refund — payout ${payoutId} failed: ${result.message ?? 'PSP error'}`,
              payoutId,
            },
          });
        });
        this.logger.log(
          `Refunded fee ${koboToNaira(feeKobo)} to partner ${payout.partnerId}`,
        );
      }

      await this.repo.updateStatus(payoutId, PayoutStatus.FAILED, {
        pspReference:  result.pspReference,
        failureReason: result.message ?? 'PSP transfer failed',
      });
      this.logger.warn(`Payout ${payoutId} FAILED: ${result.message ?? 'unknown'}`);
      throw new Error(`Transfer failed: ${result.message ?? 'unknown'}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  //  GET STATUS
  // ══════════════════════════════════════════════════════════
  async getStatus(payoutId: string, partnerId: string): Promise<PayoutStatusResponse> {
    const payout = await this.repo.findById(payoutId);
    if (!payout || payout.partnerId !== partnerId) {
      throw new NotFoundException({
        code:    ERROR_CODES.PAYOUT_NOT_FOUND,
        message: `Payout ${payoutId} not found.`,
      });
    }
    return {
      id:               payout.id,
      partnerReference: payout.partnerReference,
      status:           payout.status as PayoutStatus,
      nairaAmountKobo:  payout.nairaAmountKobo,
      deliveredAt:      payout.deliveredAt?.toISOString(),
      failureReason:    payout.failureReason ?? undefined,
      pspReference:     payout.pspReference  ?? undefined,
      bankSessionId:    payout.bankSessionId ?? undefined,
    };
  }

  // ══════════════════════════════════════════════════════════
  //  LIST
  // ══════════════════════════════════════════════════════════
  async list(partnerId: string, query: PayoutQueryDto): Promise<PayoutListResponse> {
    const page     = query.page     ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { data, total } = await this.repo.findMany({
      partnerId, page, pageSize,
      status:    query.status,
      startDate: query.startDate,
      endDate:   query.endDate,
      search:    query.search,
    });

    return {
      data: data.map((p) => ({
        id:                p.id,
        partnerReference:  p.partnerReference,
        partnerId:         p.partnerId,
        status:            p.status as PayoutStatus,
        nairaAmountKobo:   p.nairaAmountKobo,
        feeKobo:           p.feeKobo,
        exchangeRateAudit: p.exchangeRateAudit != null ? Number(p.exchangeRateAudit) : null,
        estimatedDelivery: 'same_day',
        createdAt:         p.createdAt.toISOString(),
        updatedAt:         p.updatedAt.toISOString(),
        deliveredAt:       p.deliveredAt?.toISOString(),
        narration:         p.narration     ?? undefined,
        pspReference:      p.pspReference  ?? undefined,
        failureReason:     p.failureReason ?? undefined,
        recipient:         p.recipient ? {
          fullName:      p.recipient.fullName,
          bankCode:      p.recipient.bankCode,
          bankName:      p.recipient.bankName,
          accountNumber: p.recipient.accountNumber,
          phone:         p.recipient.phone ?? undefined,
        } : null,
      })),
      total, page, pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // ══════════════════════════════════════════════════════════
  //  PRIVATE HELPERS
  // ══════════════════════════════════════════════════════════
  private formatResponse(
    payout: { id: string; partnerReference: string; status: string; createdAt: Date },
    nairaAmountKobo: number,
    feeKobo:         number,
  ): PayoutResponse {
    return {
      id:                payout.id,
      partnerReference:  payout.partnerReference,
      status:            payout.status as PayoutStatus,
      nairaAmountKobo,
      feeKobo,
      exchangeRateAudit: null,
      estimatedDelivery: 'same_day',
      createdAt:         payout.createdAt.toISOString(),
    };
  }
}