// apps/api/src/modules/auth/auth.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import type { AuthenticatedPartner } from '@elorge/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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

  async generateApiKey(
    partnerId:   string,
    label:       string,
    environment: 'live' | 'sandbox',
  ): Promise<{ fullKey: string; preview: string; id: string }> {
    const prefix = environment === 'live'
      ? (this.configService.get<string>('app.apiKeyPrefix') ?? 'el_live_')
      : (this.configService.get<string>('app.apiKeySandboxPrefix') ?? 'el_test_');

    const rawKey  = `${prefix}${uuidv4().replace(/-/g, '')}`;
    const keyHash = await bcrypt.hash(rawKey, 12);
    const preview = `${rawKey.substring(0, 16)}...${rawKey.slice(-4)}`;

    const apiKey = await this.prisma.apiKey.create({
      data: { partnerId, label, keyHash, keyPreview: preview, environment },
    });

    return { fullKey: rawKey, preview, id: apiKey.id };
  }

  async loginDashboard(
    email:    string,
    password: string,
  ): Promise<{ accessToken: string } | null> {
    const partner = await this.prisma.partner.findUnique({ where: { email } });
    if (!partner) return null;

    const token = this.jwtService.sign({
      sub:   partner.id,
      email: partner.email,
      name:  partner.name,
    });

    return { accessToken: token };
  }
}