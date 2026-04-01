// apps/api/src/database/prisma.service.ts
import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env['DATABASE_URL'],
        },
      },
      log: ['warn', 'error'],
    });
  }

  // ❌ Remove onModuleInit / $connect() — PgBouncer handles pooling externally.
  // Calling $connect() on startup holds connections open unnecessarily.

  async onModuleDestroy() {
    await this.$disconnect();
  }
}