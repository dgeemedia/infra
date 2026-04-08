// apps/api/src/modules/partners/partners.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt       from 'bcryptjs';
import * as crypto       from 'crypto';
import { ERROR_CODES }   from '@elorge/constants';
import { AuthService }   from '../auth/auth.service';
import { PrismaService } from '../../database/prisma.service';
import { VanService }    from '../van/van.service';

// ── Generate a readable temporary password ────────────────────
// Format: El-XXXXX-XXXXX  e.g. "El-Xk3mP-9qRtZ"
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(10);
  let result  = 'El-';
  for (let i = 0; i < 5; i++)  result += chars[bytes[i]! % chars.length];
  result += '-';
  for (let i = 5; i < 10; i++) result += chars[bytes[i]! % chars.length];
  return result;
}

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(
    private readonly prisma:      PrismaService,
    private readonly authService: AuthService,
    private readonly vanService:  VanService,
  ) {}

  // ── Create partner ────────────────────────────────────────
  async create(data: {
    name:      string;
    email:     string;
    country:   string;
    password?: string;
  }) {
    const existing = await this.prisma.partner.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException({
        code:    ERROR_CODES.PARTNER_ALREADY_EXISTS,
        message: `A partner with email "${data.email}" already exists.`,
      });
    }

    const tempPassword = data.password ?? generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create the partner record
    const partner = await this.prisma.partner.create({
      data: {
        name:               data.name,
        email:              data.email,
        country:            data.country,
        passwordHash,
        mustChangePassword: true,
        role:               'PARTNER',
        status:             'PENDING_REVIEW',
      },
    });

    // ── Provision Flutterwave VAN ──────────────────────────
    //
    // This gives the partner a dedicated Nigerian bank account
    // they can wire NGN to. When funds arrive, their balance
    // is auto-credited via the Flutterwave webhook.
    //
    // Runs async — don't block partner creation if FLW is slow.
    // VAN details will be null initially, provisioned within seconds.
    const van = await this.vanService.provisionForPartner({
      partnerId:   partner.id,
      partnerName: data.name,
      email:       data.email,
    });

    if (van) {
      this.logger.log(
        `Partner ${partner.id} VAN: ${van.bankName} ${van.accountNumber}`,
      );
    } else {
      this.logger.warn(
        `Partner ${partner.id} VAN provisioning skipped (no FLW key or FLW error)`,
      );
    }

    // Provision API keys
    const liveKey    = await this.authService.generateApiKey(partner.id, 'Production Key', 'live');
    const sandboxKey = await this.authService.generateApiKey(partner.id, 'Sandbox Key', 'sandbox');

    return {
      partner,
      tempPassword,
      van,            // null in dev/sandbox if FLW not configured
      apiKeys: { live: liveKey, sandbox: sandboxKey },
    };
  }

  async changePassword(partnerId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters.');
    }
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner?.passwordHash) throw new NotFoundException('Partner not found.');

    const isValid = await bcrypt.compare(currentPassword, partner.passwordHash);
    if (!isValid) throw new BadRequestException('Current password is incorrect.');
    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from the current one.');
    }

    await this.prisma.partner.update({
      where: { id: partnerId },
      data:  {
        passwordHash:       await bcrypt.hash(newPassword, 12),
        mustChangePassword: false,
      },
    });
    return { success: true };
  }

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

  async findAll() {
    return this.prisma.partner.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async updateStatus(id: string, status: 'ACTIVE' | 'SUSPENDED') {
    return this.prisma.partner.update({ where: { id }, data: { status } });
  }

  async selfSuspend(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');
    if (partner.status === 'SUSPENDED') {
      throw new ForbiddenException('Account is already suspended');
    }
    return this.prisma.partner.update({
      where: { id: partnerId },
      data:  { status: 'SUSPENDED' },
    });
  }

  async generateApiKey(partnerId: string, label: string, environment: 'live' | 'sandbox') {
    return this.authService.generateApiKey(partnerId, label, environment);
  }

  async revokeApiKey(keyId: string, partnerId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id: keyId, partnerId } });
    if (!key) throw new NotFoundException('API key not found');
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data:  { revokedAt: new Date() },
    });
  }

  async getStats(partnerId: string) {
    const [totalPayouts, delivered, failed, todayCount] = await Promise.all([
      this.prisma.payout.count({ where: { partnerId } }),
      this.prisma.payout.count({ where: { partnerId, status: 'DELIVERED' } }),
      this.prisma.payout.count({ where: { partnerId, status: 'FAILED'    } }),
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
      successRate:       totalPayouts > 0 ? Math.round((delivered / totalPayouts) * 100) : 0,
      todayPayouts:      todayCount,
    };
  }
}