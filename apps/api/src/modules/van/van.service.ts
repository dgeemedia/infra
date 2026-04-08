// apps/api/src/modules/van/van.service.ts
//
// ── Virtual Account Number (VAN) Service ─────────────────────
//
// Every partner gets a unique Flutterwave Payout Subaccount (PSA).
// This gives them a Nigerian bank account number they can wire NGN to.
// When NGN hits the VAN, Flutterwave fires a webhook → we credit
// their balanceKobo automatically.
//
// Partner dashboard shows:
//   Bank:    Wema Bank PLC (or Flutterwave's assigned bank)
//   Account: 7353333250
//   Ref:     ELORGE-FINESTPAY-001
//
// Partners can set up automatic transfers from their own system
// without any manual intervention from Elorge.

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { PrismaService }      from '../../database/prisma.service';
import * as crypto            from 'crypto';

// Flutterwave PSA creation response
interface FlwPsaCreateResponse {
  status:  string;
  message: string;
  data: {
    id:               number;
    account_reference: string;
    account_name:     string;
    barter_id:        string;
    email:            string;
    country:          string;
    nuban:            string;         // the actual account number
    bank_name:        string;
    bank_code:        string;
    status:           string;
    created_at:       string;
  };
}

// Flutterwave charge.completed webhook payload (simplified)
export interface FlwChargeWebhookPayload {
  event:  string;   // "charge.completed"
  data: {
    id:              number;
    tx_ref:          string;
    flw_ref:         string;
    amount:          number;
    currency:        string;
    status:          string;          // "successful"
    payment_type:    string;          // "banktransfer"
    account_id?:     number;
    charged_amount?: number;
    virtual_account_number?: string;
    // The account_reference we set — links back to the partner
    meta?: {
      account_reference?: string;
    };
    customer?: {
      email?: string;
      name?:  string;
    };
  };
  // Flutterwave sometimes puts account_reference at top level
  account_reference?: string;
}

@Injectable()
export class VanService {
  private readonly logger = new Logger(VanService.name);
  private readonly http:   AxiosInstance;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = this.config.get<string>('psp.flutterwave.secretKey') ?? '';
    const baseUrl   = this.config.get<string>('psp.flutterwave.baseUrl')
      ?? 'https://api.flutterwave.com/v3';

    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 30_000,
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type':  'application/json',
      },
    });
  }

  // ── Provision a VAN for a new partner ─────────────────────
  //
  // Called once during partner creation.
  // Stores the VAN details on the Partner record.
  // Returns the account number and bank for display.
  async provisionForPartner(params: {
    partnerId:   string;
    partnerName: string;
    email:       string;
  }): Promise<{
    accountNumber: string;
    bankName:      string;
    bankCode:      string;
    reference:     string;
  } | null> {
    const secretKey = this.config.get<string>('psp.flutterwave.secretKey');
    if (!secretKey) {
      this.logger.warn('[VAN] FLUTTERWAVE_SECRET_KEY not set — skipping VAN provisioning');
      return null;
    }

    // Unique reference per partner — used to match inbound webhook
    const reference = `ELORGE-${params.partnerId.substring(0, 8).toUpperCase()}`;

    try {
      const { data } = await this.http.post<FlwPsaCreateResponse>(
        '/payout-subaccounts',
        {
          account_name:      params.partnerName,
          email:             params.email,
          mobilenumber:      '08000000000',  // placeholder — FLW requires this field
          country:           'NG',
          account_reference: reference,
        },
      );

      if (data.status !== 'success') {
        this.logger.error('[VAN] Failed to create PSA', data.message);
        return null;
      }

      const van = data.data;

      // Persist to DB
      await this.prisma.partner.update({
        where: { id: params.partnerId },
        data: {
          flwVanAccountNumber: van.nuban,
          flwVanBankName:      van.bank_name,
          flwVanBankCode:      van.bank_code,
          flwVanReference:     reference,
          flwVanCreatedAt:     new Date(),
        },
      });

      this.logger.log(
        `[VAN] Provisioned for partner ${params.partnerId}: ` +
        `${van.bank_name} ${van.nuban} (ref: ${reference})`,
      );

      return {
        accountNumber: van.nuban,
        bankName:      van.bank_name,
        bankCode:      van.bank_code,
        reference,
      };
    } catch (error) {
      this.logger.error('[VAN] Error provisioning VAN', error);
      return null;
    }
  }

  // ── Verify Flutterwave webhook signature ──────────────────
  //
  // Flutterwave signs webhooks with your secret hash.
  // Set FLUTTERWAVE_WEBHOOK_HASH in .env to the value you configure
  // in Flutterwave's dashboard → Settings → Webhooks → Secret Hash.
  verifySignature(payload: string, signature: string): boolean {
    const secretHash = this.config.get<string>('psp.flutterwave.webhookHash');
    if (!secretHash) {
      this.logger.warn('[VAN] FLUTTERWAVE_WEBHOOK_HASH not set — skipping signature verification');
      return true; // allow in dev; block in prod via env
    }
    return signature === secretHash;
  }

  // ── Handle inbound charge.completed webhook ───────────────
  //
  // Called when NGN lands in any of our partner VANs.
  // Matches the VAN reference to a partner and credits their balance.
  //
  // Returns the credited amount or null if ignored.
  async handleInboundCharge(
    payload: FlwChargeWebhookPayload,
  ): Promise<{ partnerId: string; creditedKobo: number } | null> {

    // Only process successful NGN bank transfer credits
    if (payload.event !== 'charge.completed') return null;
    if (payload.data.status !== 'successful')  return null;
    if (payload.data.currency !== 'NGN')        return null;

    // Extract the account_reference — how we identify which partner this belongs to
    const reference =
      payload.account_reference ??
      payload.data.meta?.account_reference;

    if (!reference) {
      this.logger.warn('[VAN] Webhook received without account_reference', payload.data);
      return null;
    }

    // Find the partner by their VAN reference
    const partner = await this.prisma.partner.findFirst({
      where:  { flwVanReference: reference },
      select: { id: true, name: true, balanceKobo: true },
    });

    if (!partner) {
      this.logger.warn(`[VAN] No partner found for reference: ${reference}`);
      return null;
    }

    // Convert NGN to kobo (FLW sends decimal NGN, we store integer kobo)
    const nairaAmount   = payload.data.amount;
    const creditedKobo  = Math.round(nairaAmount * 100);

    if (creditedKobo <= 0) return null;

    // Idempotency: check if we've already processed this Flutterwave transaction
    const flwRef = String(payload.data.id);
    const alreadyProcessed = await this.prisma.balanceTransaction.findFirst({
      where: { description: { contains: flwRef } },
    });

    if (alreadyProcessed) {
      this.logger.warn(`[VAN] Duplicate webhook for FLW ID ${flwRef} — ignoring`);
      return null;
    }

    const newBalance = partner.balanceKobo + creditedKobo;

    // Credit balance + create ledger entry — atomically
    await this.prisma.$transaction([
      this.prisma.partner.update({
        where: { id: partner.id },
        data:  { balanceKobo: { increment: creditedKobo } },
      }),
      this.prisma.balanceTransaction.create({
        data: {
          partnerId:       partner.id,
          type:            'CREDIT',
          amountKobo:      creditedKobo,
          balanceAfterKobo: newBalance,
          description:     `VAN deposit — FLW ID ${flwRef} — ₦${nairaAmount.toLocaleString('en-NG')}`,
        },
      }),
    ]);

    // Notify the partner in-app
    const payoutsAdded = Math.floor(
      creditedKobo / (this.config.get<number>('app.platformFeeKobo') ?? 50000),
    );
    await this.prisma.notification.create({
      data: {
        partnerId: partner.id,
        type:      'BALANCE_CREDITED',
        title:     `Balance funded — ₦${nairaAmount.toLocaleString('en-NG')}`,
        body:
          `₦${nairaAmount.toLocaleString('en-NG')} has been credited to your Elorge wallet. ` +
          `You now have approximately ${payoutsAdded.toLocaleString()} additional payouts available.`,
        read:     false,
        metadata: {
          flwRef,
          nairaAmount,
          creditedKobo,
          newBalanceKobo: newBalance,
        },
      },
    });

    this.logger.log(
      `[VAN] Credited ${creditedKobo} kobo (₦${nairaAmount}) to partner ${partner.id} ` +
      `(${partner.name}) — new balance: ${newBalance} kobo`,
    );

    return { partnerId: partner.id, creditedKobo };
  }
}