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
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';

import { ERROR_CODES, PayoutStatus, getBankName, isValidBankCode } from '@elorge/constants';
import type { PayoutListResponse, PayoutResponse, PayoutStatusResponse } from '@elorge/types';

import { ComplianceService } from '../compliance/compliance.service';
import { FxService }         from '../fx/fx.service';
import { PspFactory }        from '../psp/psp.factory';
import { CreatePayoutDto, PayoutQueryDto } from './payouts.dto';
import { PayoutsRepository }              from './payouts.repository';
import { PAYOUT_QUEUE }                   from '../../queues/payout.queue';
import { PrismaService }                  from '../../database/prisma.service';

// GBP pence → display string
function penceToGbp(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly repo:          PayoutsRepository,
    private readonly fx:            FxService,
    private readonly compliance:    ComplianceService,
    private readonly pspFactory:    PspFactory,
    private readonly prisma:        PrismaService,
    private readonly configService: ConfigService,
    @InjectQueue(PAYOUT_QUEUE) private readonly payoutQueue: Queue,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  CREATE PAYOUT
  // ══════════════════════════════════════════════════════════
  async create(
    partnerId: string,
    dto:       CreatePayoutDto,
  ): Promise<PayoutResponse> {

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

    // ── 3. Calculate platform fee ─────────────────────────
    const fee      = this.fx.calculateFee(dto.sendAmount);
    const feePence = Math.round(fee * 100); // convert to integer pence

    // ── 4. Balance check — reject if insufficient funds ───
    //
    // Prefunded model: the partner must have deposited enough
    // GBP in advance. We check their balance covers the fee
    // for THIS payout. The nairaAmount is funded separately
    // from our Flutterwave NGN wallet (topped up when we
    // receive partner funds via Wise).
    //
    // minPartnerBalanceGbp env var sets the floor (default 0).
    // You can raise it to e.g. £50 to require partners to keep
    // a minimum cushion at all times.
    const minBalancePence = Math.round(
      (this.configService.get<number>('app.minPartnerBalanceGbp') ?? 0) * 100,
    );

    const partner = await this.prisma.partner.findUnique({
      where:  { id: partnerId },
      select: { balancePence: true, status: true },
    });

    if (!partner) {
      throw new NotFoundException({ code: ERROR_CODES.PARTNER_NOT_FOUND, message: 'Partner not found.' });
    }

    const balanceAfterFee = partner.balancePence - feePence;

    if (balanceAfterFee < minBalancePence) {
      // 402 Payment Required — NestJS has no built-in exception for this,
      // so we use HttpException directly.
      throw new HttpException(
        {
          code:            'INSUFFICIENT_BALANCE',
          message:         `Insufficient balance. Current: ${penceToGbp(partner.balancePence)}, `
                         + `fee: ${penceToGbp(feePence)}, `
                         + `minimum required after deduction: ${penceToGbp(minBalancePence)}. `
                         + `Please top up your account.`,
          balance:         partner.balancePence,
          feePence,
          minBalancePence,
        },
        HttpStatus.PAYMENT_REQUIRED, // 402
      );
    }

    // ── 5. Compliance screening ───────────────────────────
    this.logger.log(`Screening recipient: ${dto.recipient.fullName}`);
    const screening = await this.compliance.screenRecipient({
      fullName:      dto.recipient.fullName,
      accountNumber: dto.recipient.accountNumber,
      bankCode:      dto.recipient.bankCode,
    });

    // ── 6. Create DB record ───────────────────────────────
    const nairaAmount  = dto.nairaAmount;
    const exchangeRate = dto.exchangeRate ?? 0;
    const bankName     = getBankName(dto.recipient.bankCode);

    const payout = await this.repo.create({
      partnerId:        partnerId,
      partnerReference: dto.partnerReference,
      sendAmount:       dto.sendAmount,
      sendCurrency:     dto.sendCurrency,
      nairaAmount,
      exchangeRate,
      fee,
      narration:        dto.narration,
      recipient: {
        fullName:      dto.recipient.fullName,
        bankCode:      dto.recipient.bankCode,
        bankName,
        accountNumber: dto.recipient.accountNumber,
        phone:         dto.recipient.phone,
      },
    });

    // ── 7. Debit partner balance + write ledger entry ─────
    //    We do this inside a transaction so both writes
    //    succeed or both fail together.
    await this.prisma.$transaction([
      this.prisma.partner.update({
        where: { id: partnerId },
        data:  { balancePence: { decrement: feePence } },
      }),
      this.prisma.balanceTransaction.create({
        data: {
          partnerId,
          type:              'DEBIT',
          amountPence:       feePence,
          balanceAfterPence: balanceAfterFee,
          description:       `Fee for payout ${payout.id} (ref: ${dto.partnerReference})`,
          payoutId:          payout.id,
        },
      }),
    ]);

    // ── 8. If flagged by compliance → hold for review ─────
    if (screening.flagged) {
      await this.repo.updateStatus(payout.id, PayoutStatus.FLAGGED, {
        failureReason: screening.matchDetails ?? 'Sanctions screening match',
      });
      this.logger.warn(`Payout ${payout.id} flagged: ${screening.matchDetails ?? ''}`);
    } else {
      // ── 9. Push to async queue ────────────────────────────
      await this.payoutQueue.add(
        'dispatch',
        { payoutId: payout.id },
        {
          attempts:         5,
          backoff:          { type: 'exponential', delay: 5000 },
          jobId:            payout.id,
          removeOnComplete: true,
          removeOnFail:     false,
        },
      );
      this.logger.log(`Payout ${payout.id} queued for dispatch`);
    }

    return this.formatResponse(payout, nairaAmount, exchangeRate, fee);
  }

  // ══════════════════════════════════════════════════════════
  //  DISPATCH — called by the queue worker
  // ══════════════════════════════════════════════════════════
  async dispatch(payoutId: string): Promise<void> {
    const payout = await this.repo.findById(payoutId);

    if (!payout || !payout.recipient) {
      this.logger.error(`Dispatch: payout not found: ${payoutId}`);
      return;
    }

    if (payout.status !== PayoutStatus.PENDING) {
      this.logger.warn(`Dispatch: payout ${payoutId} already in status ${payout.status}`);
      return;
    }

    await this.repo.updateStatus(payoutId, PayoutStatus.PROCESSING);

    const psp    = this.pspFactory.getAdapter();
    const result = await psp.transfer({
      reference:     payoutId,
      amount:        Number(payout.nairaAmount),
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
      this.logger.log(`Payout ${payoutId} DELIVERED via ${result.pspReference}`);
    } else {
      // ── On failure: refund the fee back to the partner ───
      // feePence is derived from the stored `fee` (GBP decimal → integer pence).
      // We don't store feePence as a separate DB column; `fee` is the source of truth.
      const feePence = Math.round(Number(payout.fee) * 100);

      if (feePence > 0) {
        await this.prisma.$transaction(async (tx) => {
          const updated = await tx.partner.update({
            where:  { id: payout.partnerId },
            data:   { balancePence: { increment: feePence } },
            select: { balancePence: true },
          });
          await tx.balanceTransaction.create({
            data: {
              partnerId:         payout.partnerId,
              type:              'REFUND',
              amountPence:       feePence,
              balanceAfterPence: updated.balancePence,
              description:       `Fee refund for failed payout ${payoutId}`,
              payoutId,
            },
          });
        });
        this.logger.log(
          `Refunded ${penceToGbp(feePence)} to partner ${payout.partnerId} for failed payout ${payoutId}`,
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
      nairaAmount:      Number(payout.nairaAmount),
      deliveredAt:      payout.deliveredAt?.toISOString(),
      failureReason:    payout.failureReason ?? undefined,
      pspReference:     payout.pspReference  ?? undefined,
      bankSessionId:    payout.bankSessionId ?? undefined,
    };
  }

  // ══════════════════════════════════════════════════════════
  //  LIST PAYOUTS
  // ══════════════════════════════════════════════════════════
  async list(partnerId: string, query: PayoutQueryDto): Promise<PayoutListResponse> {
    const page     = query.page     ?? 1;
    const pageSize = query.pageSize ?? 20;

    const { data, total } = await this.repo.findMany({
      partnerId,
      page,
      pageSize,
      status:    query.status,
      startDate: query.startDate,
      endDate:   query.endDate,
      search:    query.search,
    });

    return {
      data: data.map((p) => ({
        payoutId:          p.id,
        partnerReference:  p.partnerReference,
        partnerId:         p.partnerId,
        status:            p.status as PayoutStatus,
        nairaAmount:       Number(p.nairaAmount),
        exchangeRate:      Number(p.exchangeRate),
        fee:               Number(p.fee),
        estimatedDelivery: 'same_day',
        createdAt:         p.createdAt.toISOString(),
        updatedAt:         p.updatedAt.toISOString(),
        deliveredAt:       p.deliveredAt?.toISOString(),
        pspReference:      p.pspReference  ?? undefined,
        failureReason:     p.failureReason ?? undefined,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private formatResponse(
    payout:       { id: string; partnerReference: string; status: string; createdAt: Date },
    nairaAmount:  number,
    exchangeRate: number,
    fee:          number,
  ): PayoutResponse {
    return {
      payoutId:          payout.id,
      partnerReference:  payout.partnerReference,
      status:            payout.status as PayoutStatus,
      nairaAmount,
      exchangeRate,
      fee,
      estimatedDelivery: 'same_day',
      createdAt:         payout.createdAt.toISOString(),
    };
  }
}