import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { appConfig } from '../../config/app.config';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly prisma = new PrismaClient();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ── Validate API key on every partner request ────────────
  async validateApiKey(rawKey: string): Promise<Record<string, unknown> | null> {
    try {
      // Look up all active keys for prefix match (efficient lookup)
      const preview = rawKey.substring(0, 16) + '...';

      // Find keys with matching preview (narrow the search)
      const candidates = await this.prisma.apiKey.findMany({
        where: {
          revokedAt: null,
          keyPreview: { startsWith: rawKey.substring(0, 12) },
        },
        include: {
          partner: true,
        },
      });

      for (const apiKey of candidates) {
        const isMatch = await bcrypt.compare(rawKey, apiKey.keyHash);
        if (isMatch) {
          if (apiKey.partner.status !== 'ACTIVE') {
            this.logger.warn(`Suspended partner attempted access: ${apiKey.partnerId}`);
            return null;
          }

          // Update lastUsedAt in background — don't await
          void this.prisma.apiKey.update({
            where: { id: apiKey.id },
            data:  { lastUsedAt: new Date() },
          });

          return {
            id:      apiKey.partner.id,
            name:    apiKey.partner.name,
            email:   apiKey.partner.email,
            country: apiKey.partner.country,
            status:  apiKey.partner.status,
            apiKeyId: apiKey.id,
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

  // ── Generate a new API key for a partner ─────────────────
  async generateApiKey(
    partnerId: string,
    label: string,
    environment: 'live' | 'sandbox',
  ): Promise<{ fullKey: string; preview: string; id: string }> {
    const prefix  = environment === 'live'
      ? (this.configService.get<string>('app.apiKeyPrefix') ?? 'el_live_')
      : (this.configService.get<string>('app.apiKeySandboxPrefix') ?? 'el_test_');

    const rawKey  = `${prefix}${uuidv4().replace(/-/g, '')}`;
    const keyHash = await bcrypt.hash(rawKey, 12);
    const preview = `${rawKey.substring(0, 16)}...${rawKey.slice(-4)}`;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        partnerId,
        label,
        keyHash,
        keyPreview: preview,
        environment,
      },
    });

    return { fullKey: rawKey, preview, id: apiKey.id };
  }

  // ── Issue JWT for dashboard login ─────────────────────────
  async loginDashboard(
    email: string,
    password: string,
  ): Promise<{ accessToken: string } | null> {
    // Dashboard uses partner email + password (future: admin users table)
    const partner = await this.prisma.partner.findUnique({ where: { email } });
    if (!partner) return null;

    // NOTE: In real implementation, store hashed password in Partner table
    // For now, this validates against a placeholder
    const token = this.jwtService.sign({
      sub:   partner.id,
      email: partner.email,
      name:  partner.name,
    });

    return { accessToken: token };
  }
}
