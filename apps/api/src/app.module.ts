// apps/api/src/app.module.ts
import { Module }        from '@nestjs/common';
import { APP_GUARD }     from '@nestjs/core';
import { ConfigModule, ConfigService }  from '@nestjs/config';
import { BullModule }    from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule }    from '@nestjs/axios';
import { PrismaModule } from './database/prisma.module';

import {
  appConfig,
  databaseConfig,
  redisConfig,
  pspConfig,
  fxConfig,
  complianceConfig,
} from './config/app.config';

import { AuthModule }       from './modules/auth/auth.module';
import { PartnersModule }   from './modules/partners/partners.module';
import { PayoutsModule }    from './modules/payouts/payouts.module';
import { FxModule }         from './modules/fx/fx.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { WebhooksModule }   from './modules/webhooks/webhooks.module';
import { PspModule }        from './modules/psp/psp.module';
import { HealthController } from './health.controller';
import { ApiKeyGuard }      from './common/guards/api-key.guard';

@Module({
  imports: [
    // ── Config — loads all environment variables ────────────
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        pspConfig,
        fxConfig,
        complianceConfig,
      ],
    }),

    // ── Bull / Redis — async job queues ─────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>('redis.url') ?? 'redis://localhost:6379',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail:     false,
        },
        tls: config.get<string>('redis.url')?.startsWith('rediss') ? {} : undefined,
      }),
    }),

    // ── Cron Jobs ───────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Health Checks ───────────────────────────────────────
    TerminusModule,
    HttpModule,

    // ── Feature Modules ─────────────────────────────────────
    AuthModule,
    PartnersModule,
    PayoutsModule,
    FxModule,
    ComplianceModule,
    WebhooksModule,
    PspModule,
  ],
  controllers: [HealthController],
  providers: [
    // ── Global API Key Guard ─────────────────────────────────
    {
      provide:  APP_GUARD,
      useClass: ApiKeyGuard,
    },
  ],
})
export class AppModule {}