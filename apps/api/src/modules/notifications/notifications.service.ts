// apps/api/src/modules/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type NotificationType =
  | 'PAYOUT_DELIVERED'
  | 'PAYOUT_FAILED'
  | 'PAYOUT_FLAGGED'
  | 'WEBHOOK_FAILED'
  | 'API_KEY_CREATED'
  | 'ACCOUNT_SUSPENDED'
  | 'SYSTEM';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create a notification (called internally by other services) ───
  async create(
    partnerId: string,
    type:      NotificationType,
    title:     string,
    body:      string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.notification.create({
      data: { partnerId, type, title, body, metadata, read: false },
    });
  }

  // ── List notifications for a partner (newest first, max 50) ───────
  async list(partnerId: string) {
    const notifications = await this.prisma.notification.findMany({
      where:   { partnerId },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { partnerId, read: false },
    });

    return { notifications, unreadCount };
  }

  // ── Mark a single notification as read ────────────────────────────
  async markRead(partnerId: string, notificationId: string) {
    // Ensure the notification belongs to this partner
    return this.prisma.notification.updateMany({
      where: { id: notificationId, partnerId },
      data:  { read: true },
    });
  }

  // ── Mark all notifications as read ────────────────────────────────
  async markAllRead(partnerId: string) {
    return this.prisma.notification.updateMany({
      where: { partnerId, read: false },
      data:  { read: true },
    });
  }
}