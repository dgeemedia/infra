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
import { InjectQueue }   from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Queue }         from 'bull';

import { ERROR_CODES, PayoutStatus, getBankName, isValidBankCode } from '@elorge/constants';
import type { PayoutListResponse, PayoutResponse, PayoutStatusResponse } from '@elorge/types';

import { ComplianceService } from '../compliance/compliance.service';
import { PspFactory }        from '../psp/psp.factory';
import { CreatePayoutDto, PayoutQueryDto } from './payouts.dto';
import { PayoutsRepository }              from './payouts.repository';
import { PAYOUT_QUEUE }                   from '../../queues/payout.queue';
import { PrismaService }                  from '../../database/prisma.service';

// ── Fee schedule ──────────────────────────────────────────────
//
//  Elorge charges partners a flat naira fee per payout.
//  Flutterwave charges Elorge ~₦26.88 (2,688 kobo) per transfer.
//  Elorge's profit = fee - ₦26.88.
//
//  Example with ₦500 fee tier:
//    Partner pays: ₦250,000 + ₦500 = ₦250,500 from their wallet
//    Flutterwave receives: ₦250,000 (exact to beneficiary)
//    Flutterwave charges Elorge: ₦26.88
//    Elorge profit per payout: ₦500 - ₦26.88 = ₦473.12
//
//  At 1,000 payouts/month: ~₦473,120 profit (~£231)
//  At 10,000 payouts/month: ~₦4,731,200 profit (~£2,310)
//
function calculateFeeKobo(nairaAmountKobo: number): number {
  // Amounts in kobo (1 NGN = 100 kobo)
  const TIERS: Array<{ maxKobo: number; feeKobo: number }> = [
    { maxKobo: 5_000_000,    feeKobo: 15_000  }, // ≤ ₦50,000   → fee ₦150
    { maxKobo: 20_000_000,   feeKobo: 25_000  }, // ≤ ₦200,000  → fee ₦250
    { maxKobo: 100_000_000,  feeKobo: 40_000  }, // ≤ ₦1,000,000→ fee ₦400
    { maxKobo: Infinity,     feeKobo: 60_000  }, // > ₦1,000,000→ fee ₦600
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
    //
    // Partner's wallet must cover:
    //   nairaAmountKobo  → goes to the recipient via Flutterwave
    //   feeKobo          → stays with Elorge (minus Flutterwave's ~₦27)
    //
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
          code:            'INSUFFICIENT_BALANCE',
          message:
            `Insufficient Naira wallet balance. ` +
            `Required: ${koboToNaira(totalDebitKobo)} ` +
            `(${koboToNaira(nairaAmountKobo)} payout + ${koboToNaira(feeKobo)} fee). ` +
            `Available: ${koboToNaira(partner.balanceKobo)}. ` +
            `Fund your wallet by transferring Naira to your dedicated account number.`,
          required:  totalDebitKobo,
          available: partner.balanceKobo,
          fee:       feeKobo,
          nairaAmount: nairaAmountKobo,
        },
        HttpStatus.PAYMENT_REQUIRED,  // 402
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
    //
    // $transaction ensures we never debit without creating the payout
    // record, and never create the record without debiting.
    //
    const bankName = getBankName(dto.recipient.bankCode);

    let payoutId: string;

    await this.prisma.$transaction(async (tx) => {
      // Create payout record
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

      // Debit partner wallet: nairaAmountKobo + feeKobo
      await tx.partner.update({
        where: { id: partnerId },
        data:  { balanceKobo: { decrement: totalDebitKobo } },
      });

      // Ledger entry
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
        where: { id: payoutId! },
        data:  { status: 'FLAGGED', failureReason: screening.matchDetails ?? 'Sanctions match' },
      });
      this.logger.warn(`Payout ${payoutId} flagged: ${screening.matchDetails}`);
    } else {
      await this.payoutQueue.add(
        'dispatch',
        { payoutId: payoutId! },
        {
          attempts:         5,
          backoff:          { type: 'exponential', delay: 5_000 },
          jobId:            payoutId!,
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
    const payoutsLeft = Math.floor(balanceAfterKobo / feeKobo);
    if (payoutsLeft < LOW_BALANCE_PAYOUTS && payoutsLeft >= 0) {
      void this.sendLowBalanceAlert(partnerId, balanceAfterKobo, payoutsLeft);
    }

    const payout = await this.repo.findById(payoutId!);
    return this.formatResponse(payout!, nairaAmountKobo, feeKobo);
  }

  // ── Low balance alert ─────────────────────────────────────
  private async sendLowBalanceAlert(
    partnerId:    string,
    balanceKobo:  number,
    payoutsLeft:  number,
  ): Promise<void> {
    try {
      // Throttle: only one alert per 24 hours
      const recent = await this.prisma.notification.findFirst({
        where: {
          partnerId,
          type:      'BALANCE_LOW',
          createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
        },
      });
      if (recent) return;

      await this.prisma.notification.create({
        data: {
          partnerId,
          type:  'BALANCE_LOW',
          title: `Low wallet balance — ${payoutsLeft} payouts remaining`,
          body:
            `Your Elorge wallet is running low (${koboToNaira(balanceKobo)}). ` +
            `At the current fee rate, you have approximately ${payoutsLeft} payouts left. ` +
            `Transfer Naira to your dedicated account number to top up.`,
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

    const psp    = this.pspFactory.getAdapter();  // Flutterwave → Bankly fallover
    const result = await psp.transfer({
      reference:     payoutId,
      // Convert kobo → naira for Flutterwave (FLW expects NGN decimal)
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
      // ── Refund the fee on failure ──────────────────────
      //
      // We keep the nairaAmountKobo deducted (it was never sent —
      // it stays in our Flutterwave wallet as part of the float).
      // We refund only the Elorge fee (feeKobo) as a gesture of
      // fairness — the payout did not succeed.
      //
      // The nairaAmountKobo gets credited back when we retry.
      // On final failure, we refund everything (nairaAmount + fee).
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
          `Refunded fee ${koboToNaira(feeKobo)} to partner ${payout.partnerId} ` +
          `for failed payout ${payoutId}`,
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
      payoutId:         payout.id,
      partnerReference: payout.partnerReference,
      status:           payout.status as PayoutStatus,
      nairaAmount:      payout.nairaAmountKobo / 100,
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
      status: query.status, startDate: query.startDate,
      endDate: query.endDate, search: query.search,
    });

    return {
      data: data.map((p) => ({
        payoutId:          p.id,
        partnerReference:  p.partnerReference,
        partnerId:         p.partnerId,
        status:            p.status as PayoutStatus,
        nairaAmount:       p.nairaAmountKobo / 100,
        exchangeRate:      Number(p.exchangeRateAudit ?? 0),
        fee:               p.feeKobo / 100,
        estimatedDelivery: 'same_day',
        createdAt:         p.createdAt.toISOString(),
        updatedAt:         p.updatedAt.toISOString(),
        deliveredAt:       p.deliveredAt?.toISOString(),
        pspReference:      p.pspReference  ?? undefined,
        failureReason:     p.failureReason ?? undefined,
      })),
      total, page, pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private formatResponse(
    payout: { id: string; partnerReference: string; status: string; createdAt: Date },
    nairaAmountKobo: number,
    feeKobo:         number,
  ): PayoutResponse {
    return {
      payoutId:          payout.id,
      partnerReference:  payout.partnerReference,
      status:            payout.status as PayoutStatus,
      nairaAmount:       nairaAmountKobo / 100,
      exchangeRate:      0,
      fee:               feeKobo / 100,
      estimatedDelivery: 'same_day',
      createdAt:         payout.createdAt.toISOString(),
    };
  }
}