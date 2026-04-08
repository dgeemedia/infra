// apps/api/src/modules/van/van.controller.ts
//
// ── Flutterwave Inbound Webhook Controller ────────────────────
//
// Flutterwave calls this endpoint when NGN lands in a partner VAN.
// This is the "automatic wallet top-up" that makes the system
// fully self-service for partners.
//
// Setup in Flutterwave dashboard:
//   Settings → Webhooks → URL: https://api.elorge.com/v1/webhooks/flutterwave
//   Secret Hash: set FLUTTERWAVE_WEBHOOK_HASH in your .env

import {
  Body, Controller, Headers, HttpCode, HttpStatus, Logger, Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public }                from '../../common/decorators/public.decorator';
import { VanService, FlwChargeWebhookPayload } from './van.service';

@ApiTags('Webhooks (Inbound)')
@Controller('v1/webhooks/flutterwave')
export class VanController {
  private readonly logger = new Logger(VanController.name);

  constructor(private readonly vanService: VanService) {}

  /**
   * POST /v1/webhooks/flutterwave
   *
   * Flutterwave sends charge.completed events here when NGN lands
   * in a partner's Virtual Account Number.
   *
   * Must be @Public() — no API key, Flutterwave calls this directly.
   * Security is via the verif-hash header signature check.
   *
   * Flutterwave retries up to 5 times if we return anything other
   * than 200, so we always return 200 even for ignored events.
   */
  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:     'Flutterwave inbound webhook (charge.completed)',
    description: 'Called by Flutterwave when NGN lands in a partner VAN. Automatically credits partner wallet.',
  })
  async handleFlutterwaveWebhook(
    @Body()                         payload:   FlwChargeWebhookPayload,
    @Headers('verif-hash')          signature: string,
  ) {
    // ── 1. Verify signature ─────────────────────────────────
    const isValid = this.vanService.verifySignature(
      JSON.stringify(payload),
      signature,
    );

    if (!isValid) {
      this.logger.warn(
        `[VAN Webhook] Invalid signature — possible spoofed request. ` +
        `Event: ${payload.event}`,
      );
      // Return 200 anyway — don't expose that signature failed
      return { received: true };
    }

    // ── 2. Process the event ────────────────────────────────
    this.logger.log(
      `[VAN Webhook] Received: ${payload.event} | ` +
      `amount: ₦${payload.data?.amount} | ` +
      `status: ${payload.data?.status}`,
    );

    const result = await this.vanService.handleInboundCharge(payload);

    if (result) {
      this.logger.log(
        `[VAN Webhook] Credited ${result.creditedKobo} kobo to partner ${result.partnerId}`,
      );
    }

    // Always return 200 — Flutterwave will retry if we return anything else
    return { received: true };
  }
}