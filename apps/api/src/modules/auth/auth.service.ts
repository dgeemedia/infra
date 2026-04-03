// apps/api/src/modules/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService }         from '@nestjs/jwt';
import { ConfigService }      from '@nestjs/config';
import * as bcrypt            from 'bcryptjs';
import { v4 as uuidv4 }       from 'uuid';

import { PrismaService }             from '../../database/prisma.service';
import type { AuthenticatedPartner } from '@elorge/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma:        PrismaService,
    private readonly jwtService:    JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Validate raw API key (external partner API calls) ─────
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

  // ── Validate dashboard JWT session token ──────────────────
  // Used by ApiKeyGuard when the Authorization header contains a JWT
  // (dashboard users) instead of a raw API key (external partners).
  // Verifies signature + checks the account is still ACTIVE in the DB,
  // so suspending a partner takes effect immediately on the next request.
  async validateJwtToken(token: string): Promise<AuthenticatedPartner | null> {
    try {
      const payload = this.jwtService.verify<{
        sub:   string;
        email: string;
        name:  string;
        role:  string;
      }>(token, {
        secret: this.configService.get<string>('app.jwtSecret'),
      });

      const partner = await this.prisma.partner.findUnique({
        where: { id: payload.sub },
      });

      if (!partner || partner.status !== 'ACTIVE') {
        this.logger.warn(`JWT auth: partner not found or inactive: ${payload.sub}`);
        return null;
      }

      return {
        id:          partner.id,
        name:        partner.name,
        email:       partner.email,
        country:     partner.country,
        status:      partner.status,
        apiKeyId:    'dashboard-session',
        environment: 'live',
      };
    } catch (error) {
      this.logger.warn('JWT token validation failed:', error);
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

  // ── Dashboard login ────────────────────────────────────────
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
        role:  partner.role,
      });

      return { accessToken: token };
    } catch (error) {
      this.logger.error('Dashboard login error', error);
      return null;
    }
  }
}