// apps/api/src/modules/partners/partners.service.ts
import {
  ConflictException, ForbiddenException,
  Injectable, NotFoundException,
} from '@nestjs/common';
import * as bcrypt       from 'bcryptjs';
import { ERROR_CODES }   from '@elorge/constants';
import { AuthService }   from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma:      PrismaService,
    private readonly authService: AuthService,
  ) {}

  // ── Create partner ────────────────────────────────────────
  async create(data: {
    name:     string;
    email:    string;
    country:  string;
    password: string;
  }) {
    const existing = await this.prisma.partner.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new ConflictException({
        code:    ERROR_CODES.PARTNER_ALREADY_EXISTS,
        message: `A partner with email "${data.email}" already exists.`,
      });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const partner = await this.prisma.partner.create({
      data: {
        name:         data.name,
        email:        data.email,
        country:      data.country,
        passwordHash,
        role:         'PARTNER',
        status:       'PENDING_REVIEW',
      },
    });

    // Provision live + sandbox API keys immediately
    const liveKey    = await this.authService.generateApiKey(partner.id, 'Production Key', 'live');
    const sandboxKey = await this.authService.generateApiKey(partner.id, 'Sandbox Key', 'sandbox');

    return {
      partner,
      apiKeys: { live: liveKey, sandbox: sandboxKey },
    };
  }

  // ── Find by ID ────────────────────────────────────────────
  async findById(id: string) {
    const partner = await this.prisma.partner.findUnique({
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

  // ── Find all ──────────────────────────────────────────────
  async findAll() {
    return this.prisma.partner.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Update status (admin use) ─────────────────────────────
  async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    return this.prisma.partner.update({
      where: { id },
      data:  { status },
    });
  }

  // ── Self-suspend ──────────────────────────────────────────
  //    Called by the partner via PATCH /v1/partners/me/suspend.
  //    Sets status to SUSPENDED — only an admin can reactivate.
  async selfSuspend(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
    });
    if (!partner) {
      throw new NotFoundException('Partner not found');
    }
    if (partner.status === 'SUSPENDED') {
      throw new ForbiddenException('Account is already suspended');
    }

    return this.prisma.partner.update({
      where: { id: partnerId },
      data:  { status: 'SUSPENDED' },
    });
  }

  // ── API key management ────────────────────────────────────
  async generateApiKey(
    partnerId:   string,
    label:       string,
    environment: 'live' | 'sandbox',
  ) {
    return this.authService.generateApiKey(partnerId, label, environment);
  }

  async revokeApiKey(keyId: string, partnerId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, partnerId },
    });
    if (!key) throw new NotFoundException('API key not found');
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data:  { revokedAt: new Date() },
    });
  }

  // ── Payout stats ──────────────────────────────────────────
  async getStats(partnerId: string) {
    const [totalPayouts, delivered, failed, todayCount] = await Promise.all([
      this.prisma.payout.count({ where: { partnerId } }),
      this.prisma.payout.count({ where: { partnerId, status: 'DELIVERED' } }),
      this.prisma.payout.count({ where: { partnerId, status: 'FAILED' } }),
      this.prisma.payout.count({
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
      successRate:       totalPayouts > 0
        ? Math.round((delivered / totalPayouts) * 100)
        : 0,
      todayPayouts: todayCount,
    };
  }
}