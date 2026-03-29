import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import { PrismaClient }       from '@prisma/client';
import axios                  from 'axios';
import * as crypto            from 'crypto';
import { v4 as uuidv4 }       from 'uuid';

import type { WebhookEventType } from '@elorge/types';

const prisma = new PrismaClient();

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly config: ConfigService) {}

  // ── Fire a payout lifecycle event to all partner webhooks ─
  async firePayoutEvent(
    payoutId: string,
    event:    WebhookEventType,
  ): Promise<void> {
    // Load payout
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { recipient: true },
    });
    if (!payout) return;

    // Find all active webhook configs for this partner that subscribe to this event
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        partnerId: payout.partnerId,
        isActive:  true,
        events:    { has: event },
      },
    });

    if (webhooks.length === 0) {
      this.logger.debug(`No webhooks registered for partner ${payout.partnerId} event ${event}`);
      return;
    }

    // Fire to all registered webhooks concurrently
    await Promise.allSettled(
      webhooks.map((webhook) =>
        this.deliverWebhook(webhook.id, payout, event, webhook.url, webhook.secret),
      ),
    );
  }

  // ── Deliver a single webhook with retry logging ────────────
  private async deliverWebhook(
    webhookId: string,
    payout:    {
      id:               string;
      partnerReference: string;
      status:           string;
      nairaAmount:      unknown;
      deliveredAt:      Date | null;
      failureReason:    string | null;
    },
    event:     WebhookEventType,
    url:       string,
    secret:    string,
  ): Promise<void> {
    const deliveryId = uuidv4();
    const timestamp  = new Date().toISOString();

    const payload = {
      id:               deliveryId,
      event,
      payoutId:         payout.id,
      partnerReference: payout.partnerReference,
      status:           payout.status,
      nairaAmount:      Number(payout.nairaAmount),
      deliveredAt:      payout.deliveredAt?.toISOString(),
      failureReason:    payout.failureReason ?? undefined,
      timestamp,
    };

    // HMAC-SHA256 signature so partner can verify authenticity
    const signature = this.sign(payload, secret);
    const payloadWithSig = { ...payload, signature };

    // Create delivery log record
    const delivery = await prisma.webhookDelivery.create({
      data: {
        id:        deliveryId,
        payoutId:  payout.id,
        webhookId,
        event,
        payload:   payloadWithSig,
        status:    'PENDING',
        attempt:   1,
      },
    });

    try {
      const response = await axios.post(url, payloadWithSig, {
        headers: {
          'Content-Type':        'application/json',
          'X-Elorge-Signature':  `sha256=${signature}`,
          'X-Elorge-Event':      event,
          'X-Elorge-Delivery':   deliveryId,
        },
        timeout: 10_000,
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status:       'SUCCESS',
          responseCode: response.status,
          responseBody: JSON.stringify(response.data).substring(0, 500),
        },
      });

      this.logger.log(`Webhook delivered: ${event} → ${url} [${response.status}]`);
    } catch (error) {
      const statusCode = axios.isAxiosError(error)
        ? (error.response?.status ?? 0)
        : 0;

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status:       'FAILED',
          responseCode: statusCode,
          responseBody: axios.isAxiosError(error)
            ? String(error.response?.data ?? error.message).substring(0, 500)
            : String(error),
          nextRetryAt:  new Date(Date.now() + 5 * 60 * 1000), // retry in 5 mins
        },
      });

      this.logger.warn(`Webhook delivery failed: ${event} → ${url} [${statusCode}]`);
    }
  }

  // ── Register a webhook URL for a partner ──────────────────
  async register(
    partnerId: string,
    url:       string,
    events:    WebhookEventType[],
  ): Promise<{ id: string; secret: string }> {
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await prisma.webhookConfig.create({
      data: { partnerId, url, events, secret, isActive: true },
    });

    return { id: webhook.id, secret };
  }

  // ── List webhooks for a partner ───────────────────────────
  async list(partnerId: string) {
    return prisma.webhookConfig.findMany({
      where:   { partnerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── HMAC-SHA256 signing ───────────────────────────────────
  private sign(payload: Record<string, unknown>, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
