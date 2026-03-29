import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { ERROR_CODES } from '@elorge/constants';
import { AuthService }  from '../auth/auth.service';

const prisma = new PrismaClient();

@Injectable()
export class PartnersService {
  constructor(private readonly authService: AuthService) {}

  // ── Create a new partner (admin only) ─────────────────────
  async create(data: { name: string; email: string; country: string }) {
    const existing = await prisma.partner.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException({
        code:    ERROR_CODES.PARTNER_ALREADY_EXISTS,
        message: `A partner with email "${data.email}" already exists.`,
      });
    }

    const partner = await prisma.partner.create({
      data: { ...data, status: 'PENDING_REVIEW' },
    });

    // Auto-generate first API key pair (live + sandbox)
    const liveKey    = await this.authService.generateApiKey(partner.id, 'Production Key', 'live');
    const sandboxKey = await this.authService.generateApiKey(partner.id, 'Sandbox Key', 'sandbox');

    return {
      partner,
      apiKeys: {
        live:    { ...liveKey },
        sandbox: { ...sandboxKey },
      },
    };
  }

  // ── Find partner by ID ────────────────────────────────────
  async findById(id: string) {
    const partner = await prisma.partner.findUnique({
      where:   { id },
      include: { apiKeys: { where: { revokedAt: null } } },
    });
    if (!partner) {
      throw new NotFoundException({
        code:    ERROR_CODES.PARTNER_NOT_FOUND,
        message: `Partner ${id} not found.`,
      });
    }
    return partner;
  }

  // ── List all partners ─────────────────────────────────────
  async findAll() {
    return prisma.partner.findMany({ orderBy: { createdAt: 'desc' } });
  }

  // ── Activate or suspend a partner ─────────────────────────
  async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    return prisma.partner.update({
      where: { id },
      data:  { status },
    });
  }

  // ── Generate a new API key for an existing partner ────────
  async generateApiKey(
    partnerId:   string,
    label:       string,
    environment: 'live' | 'sandbox',
  ) {
    return this.authService.generateApiKey(partnerId, label, environment);
  }

  // ── Revoke an API key ─────────────────────────────────────
  async revokeApiKey(keyId: string, partnerId: string) {
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, partnerId },
    });
    if (!key) {
      throw new NotFoundException('API key not found');
    }
    return prisma.apiKey.update({
      where: { id: keyId },
      data:  { revokedAt: new Date() },
    });
  }

  // ── Get partner stats ─────────────────────────────────────
  async getStats(partnerId: string) {
    const [totalPayouts, delivered, failed, todayCount] = await Promise.all([
      prisma.payout.count({ where: { partnerId } }),
      prisma.payout.count({ where: { partnerId, status: 'DELIVERED' } }),
      prisma.payout.count({ where: { partnerId, status: 'FAILED' } }),
      prisma.payout.count({
        where: {
          partnerId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return {
      totalPayouts,
      successfulPayouts: delivered,
      failedPayouts:     failed,
      successRate:       totalPayouts > 0 ? Math.round((delivered / totalPayouts) * 100) : 0,
      todayPayouts:      todayCount,
    };
  }
}
