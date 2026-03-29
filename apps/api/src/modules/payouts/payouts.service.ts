import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { ERROR_CODES, PayoutStatus, getBankName, isValidBankCode } from '@elorge/constants';
import type { PayoutListResponse, PayoutResponse, PayoutStatusResponse } from '@elorge/types';

import { ComplianceService } from '../compliance/compliance.service';
import { FxService }         from '../fx/fx.service';
import { PspFactory }        from '../psp/psp.factory';
import { CreatePayoutDto, PayoutQueryDto } from './payouts.dto';
import { PayoutsRepository }              from './payouts.repository';
import { PAYOUT_QUEUE }                   from '../../queues/payout.queue';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly repo:       PayoutsRepository,
    private readonly fx:         FxService,
    private readonly compliance: ComplianceService,
    private readonly pspFactory: PspFactory,
    @InjectQueue(PAYOUT_QUEUE) private readonly payoutQueue: Queue,
  ) {}

  // ══════════════════════════════════════════════════════════
  //  CREATE PAYOUT — called by FinestPay via POST /v1/payouts
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

    // ── 3. Compliance screening ───────────────────────────
    this.logger.log(`Screening recipient: ${dto.recipient.fullName}`);
    const screening = await this.compliance.screenRecipient({
      fullName:      dto.recipient.fullName,
      accountNumber: dto.recipient.accountNumber,
      bankCode:      dto.recipient.bankCode,
    });

    // ── 4. FX calculation ─────────────────────────────────
    const { nairaAmount, rate, fee } = await this.fx.convertToNaira(
      dto.sendCurrency,
      dto.sendAmount,
    );

    // ── 5. Create DB record ───────────────────────────────
    const bankName = getBankName(dto.recipient.bankCode);
    const payout   = await this.repo.create({
      partnerId:        partnerId,
      partnerReference: dto.partnerReference,
      sendAmount:       dto.sendAmount,
      sendCurrency:     dto.sendCurrency,
      nairaAmount,
      exchangeRate:     rate,
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

    // ── 6. If flagged by compliance → hold for review ─────
    if (screening.flagged) {
      await this.repo.updateStatus(payout.id, PayoutStatus.FLAGGED, {
        failureReason: screening.matchDetails ?? 'Sanctions screening match',
      });
      this.logger.warn(`Payout ${payout.id} flagged: ${screening.matchDetails ?? ''}`);
    } else {
      // ── 7. Push to async queue for PSP dispatch ──────────
      await this.payoutQueue.add(
        'dispatch',
        { payoutId: payout.id },
        {
          attempts:  5,
          backoff:   { type: 'exponential', delay: 5000 },
          jobId:     payout.id,            // idempotency — prevents duplicate jobs
          removeOnComplete: true,
          removeOnFail:     false,
        },
      );
      this.logger.log(`Payout ${payout.id} queued for dispatch`);
    }

    // ── 8. Return immediately — don't wait for bank ───────
    return this.formatResponse(payout, nairaAmount, rate, fee);
  }

  // ══════════════════════════════════════════════════════════
  //  DISPATCH — called by the queue worker (not the API)
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

    // Mark as processing
    await this.repo.updateStatus(payoutId, PayoutStatus.PROCESSING);

    // Call PSP adapter
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
      await this.repo.updateStatus(payoutId, PayoutStatus.FAILED, {
        pspReference:  result.pspReference,
        failureReason: result.message ?? 'PSP transfer failed',
      });
      this.logger.warn(`Payout ${payoutId} FAILED: ${result.message ?? 'unknown'}`);
      // Throw so BullMQ knows to retry
      throw new Error(`Transfer failed: ${result.message ?? 'unknown'}`);
    }
  }

  // ══════════════════════════════════════════════════════════
  //  GET STATUS — GET /v1/payouts/:id
  // ══════════════════════════════════════════════════════════
  async getStatus(
    payoutId:  string,
    partnerId: string,
  ): Promise<PayoutStatusResponse> {
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
  //  LIST PAYOUTS — GET /v1/payouts
  // ══════════════════════════════════════════════════════════
  async list(
    partnerId: string,
    query:     PayoutQueryDto,
  ): Promise<PayoutListResponse> {
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
      data:       data.map((p) => ({
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

  // ── Format API response ────────────────────────────────────
  private formatResponse(
    payout:      { id: string; partnerReference: string; status: string; createdAt: Date },
    nairaAmount: number,
    rate:        number,
    fee:         number,
  ): PayoutResponse {
    return {
      payoutId:          payout.id,
      partnerReference:  payout.partnerReference,
      status:            payout.status as PayoutStatus,
      nairaAmount,
      exchangeRate:      rate,
      fee,
      estimatedDelivery: 'same_day',
      createdAt:         payout.createdAt.toISOString(),
    };
  }
}
