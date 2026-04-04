// apps/api/src/modules/webhooks/webhooks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService }      from '@nestjs/config';
import axios                  from 'axios';
import * as crypto            from 'crypto';
import { v4 as uuidv4 }       from 'uuid';
import { PrismaService }         from '../../database/prisma.service';
import { NotificationsService }  from '../notifications/notifications.service';
import type { WebhookEventType } from '@elorge/types';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma:        PrismaService,
    private readonly config:        ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── Fire a payout lifecycle event to all partner webhooks ─────────
  async firePayoutEvent(
    payoutId: string,
    event:    WebhookEventType,
  ): Promise<void> {
    const payout = await this.prisma.payout.findUnique({
      where:   { id: payoutId },
      include: { recipient: true },
    });
    if (!payout) return;

    // ── Create an in-app notification for the partner ──────────────
    const notifMap: Record<WebhookEventType, { title: string; body: string } | null> = {
      'payout.delivered': {
        title: 'Payout Delivered',
        body:  `${payout.partnerReference} was successfully credited to the recipient.`,
      },
      'payout.failed': {
        title: 'Payout Failed',
        body:  `${payout.partnerReference} failed after all retries. ${payout.failureReason ?? ''}`.trim(),
      },
      'payout.flagged': {
        title: 'Payout Flagged',
        body:  `${payout.partnerReference} is on hold pending compliance review.`,
      },
      'payout.processing': null, // not noisy enough to warrant a notification
    };

    const notif = notifMap[event];
    if (notif) {
      const typeMap: Record<string, 'PAYOUT_DELIVERED' | 'PAYOUT_FAILED' | 'PAYOUT_FLAGGED'> = {
        'payout.delivered': 'PAYOUT_DELIVERED',
        'payout.failed':    'PAYOUT_FAILED',
        'payout.flagged':   'PAYOUT_FLAGGED',
      };
      await this.notifications.create(
        payout.partnerId,
        typeMap[event]!,
        notif.title,
        notif.body,
        { payoutId: payout.id },
      );
    }

    // ── Deliver to all subscribed webhook endpoints ─────────────────
    const webhooks = await this.prisma.webhookConfig.findMany({
      where: {
        partnerId: payout.partnerId,
        isActive:  true,
        events:    { has: event },
      },
    });

    if (webhooks.length === 0) {
      this.logger.debug(`No webhooks for partner ${payout.partnerId} event ${event}`);
      return;
    }

    await Promise.allSettled(
      webhooks.map((wh) =>
        this.deliverWebhook(wh.id, payout, event, wh.url, wh.secret),
      ),
    );
  }

  // ── Deliver a single webhook ───────────────────────────────────────
  private async deliverWebhook(
    webhookId: string,
    payout: {
      id:               string;
      partnerReference: string;
      status:           string;
      partnerId:        string;
      nairaAmount:      unknown;
      deliveredAt:      Date | null;
      failureReason:    string | null;
    },
    event:  WebhookEventType,
    url:    string,
    secret: string,
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

    const signature      = this.sign(payload, secret);
    const payloadWithSig = { ...payload, signature };

    const delivery = await this.prisma.webhookDelivery.create({
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
          'Content-Type':       'application/json',
          'X-Elorge-Signature': `sha256=${signature}`,
          'X-Elorge-Event':     event,
          'X-Elorge-Delivery':  deliveryId,
        },
        timeout: 10_000,
      });

      await this.prisma.webhookDelivery.update({
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

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status:       'FAILED',
          responseCode: statusCode,
          responseBody: axios.isAxiosError(error)
            ? String(error.response?.data ?? error.message).substring(0, 500)
            : String(error),
          nextRetryAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      this.logger.warn(`Webhook delivery failed: ${event} → ${url} [${statusCode}]`);

      // Notify the partner so they can investigate
      await this.notifications.create(
        payout.partnerId,
        'WEBHOOK_FAILED',
        'Webhook Delivery Failed',
        `Failed to deliver ${event} to ${url}. A retry is scheduled in 5 minutes.`,
        { webhookId, payoutId: payout.id, statusCode },
      );
    }
  }

  // ── Register a webhook URL for a partner ──────────────────────────
  async register(
    partnerId: string,
    url:       string,
    events:    WebhookEventType[],
  ): Promise<{ id: string; secret: string }> {
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await this.prisma.webhookConfig.create({
      data: { partnerId, url, events, secret, isActive: true },
    });

    return { id: webhook.id, secret };
  }

  // ── List webhooks for a partner ───────────────────────────────────
  async list(partnerId: string) {
    return this.prisma.webhookConfig.findMany({
      where:   { partnerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── HMAC-SHA256 signing ───────────────────────────────────────────
  private sign(payload: Record<string, unknown>, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}