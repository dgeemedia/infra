// apps/api/src/database/prisma.service.ts
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: { url: process.env['DATABASE_URL'] },
      },
      log: ['warn', 'error'],
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from Supabase PostgreSQL');
  }

  async testConnection() {
    await this.$queryRaw`SELECT 1`;
    this.logger.log('✅ Connected to Supabase PostgreSQL');
  }
}