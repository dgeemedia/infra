// apps/api/src/app.module.ts
import { Module }        from '@nestjs/common';
import { ConfigModule, ConfigService }  from '@nestjs/config';
import { BullModule }    from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule }    from '@nestjs/axios';

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

@Module({
  imports: [
    // ── Config — loads all environment variables ────────────
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
})
export class AppModule {}
