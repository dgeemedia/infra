// apps/api/src/modules/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService }         from '@nestjs/jwt';
import { ConfigService }      from '@nestjs/config';
import * as bcrypt            from 'bcryptjs';
import { v4 as uuidv4 }       from 'uuid';

import { PrismaService }            from '../../database/prisma.service';
import type { AuthenticatedPartner } from '@elorge/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:       PrismaService,   // ← injected, not new PrismaClient()
    private readonly jwtService:   JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Validate API key (for partner API calls) ──────────────
  async validateApiKey(rawKey: string): Promise<AuthenticatedPartner | null> {
    try {
      const candidates = await this.prisma.apiKey.findMany({
        where: {
          revokedAt:  null,
          keyPreview: { startsWith: rawKey.substring(0, 12) },
        },
        include: { partner: true },
      });

      for (const apiKey of candidates) {
        const isMatch = await bcrypt.compare(rawKey, apiKey.keyHash);
        if (isMatch) {
          if (apiKey.partner.status !== 'ACTIVE') {
            this.logger.warn(`Suspended partner attempted access: ${apiKey.partnerId}`);
            return null;
          }

          // fire-and-forget — don't await
          void this.prisma.apiKey.update({
            where: { id: apiKey.id },
            data:  { lastUsedAt: new Date() },
          });

          return {
            id:          apiKey.partner.id,
            name:        apiKey.partner.name,
            email:       apiKey.partner.email,
            country:     apiKey.partner.country,
            status:      apiKey.partner.status,
            apiKeyId:    apiKey.id,
            environment: apiKey.environment,
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.error('API key validation error', error);
      return null;
    }
  }

  // ── Generate API key for a partner ────────────────────────
  async generateApiKey(
    partnerId:   string,
    label:       string,
    environment: 'live' | 'sandbox',
  ): Promise<{ fullKey: string; preview: string; id: string }> {
    const prefix = environment === 'live'
      ? (this.configService.get<string>('app.apiKeyPrefix')        ?? 'el_live_')
      : (this.configService.get<string>('app.apiKeySandboxPrefix') ?? 'el_test_');

    const rawKey  = `${prefix}${uuidv4().replace(/-/g, '')}`;
    const keyHash = await bcrypt.hash(rawKey, 12);
    const preview = `${rawKey.substring(0, 16)}...${rawKey.slice(-4)}`;

    const apiKey = await this.prisma.apiKey.create({
      data: { partnerId, label, keyHash, keyPreview: preview, environment },
    });

    return { fullKey: rawKey, preview, id: apiKey.id };
  }

  // ── Dashboard login — validates email + password ──────────
  // Returns JWT with role embedded so AdminGuard can verify admin access
  async loginDashboard(
    email:    string,
    password: string,
  ): Promise<{ accessToken: string } | null> {
    try {
      const partner = await this.prisma.partner.findUnique({ where: { email } });

      if (!partner) {
        this.logger.warn(`Login attempt for unknown email: ${email}`);
        return null;
      }

      if (partner.status !== 'ACTIVE') {
        this.logger.warn(`Suspended partner attempted login: ${email}`);
        return null;
      }

      if (!partner.passwordHash) {
        this.logger.warn(`Partner has no password set: ${email}`);
        return null;
      }

      const isValid = await bcrypt.compare(password, partner.passwordHash);
      if (!isValid) {
        this.logger.warn(`Invalid password for: ${email}`);
        return null;
      }

      const token = this.jwtService.sign({
        sub:   partner.id,
        email: partner.email,
        name:  partner.name,
        role:  partner.role,   // 'ADMIN' | 'PARTNER' — read by AdminGuard
      });

      return { accessToken: token };
    } catch (error) {
      this.logger.error('Dashboard login error', error);
      return null;
    }
  }
}