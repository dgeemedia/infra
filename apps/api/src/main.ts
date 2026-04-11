// apps/api/src/main.ts
import { NestFactory }          from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService }         from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule }             from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor }    from './common/interceptors/logging.interceptor';
import { TransformInterceptor }  from './common/interceptors/transform.interceptor';
import { PrismaService }         from './database/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app    = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // ── CORS ─────────────────────────────────────────────────
  const allowedOrigins = (
    config.get<string>('app.corsOrigins') ??
    'http://localhost:3000'
  ).split(',').map((o) => o.trim());

  app.enableCors({
    origin:         allowedOrigins,
    methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials:    true,
  });

  // ── Global Prefix ─────────────────────────────────────────
  app.setGlobalPrefix('', { exclude: ['health'] });

  // ── Global Pipes ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
      transformOptions:     { enableImplicitConversion: true },
    }),
  );

  // ── Global Filters ────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Global Interceptors ───────────────────────────────────
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ── Swagger ───────────────────────────────────────────────
  const swaggerEnabled =
    process.env['NODE_ENV'] !== 'production' ||
    process.env['SWAGGER_ENABLED'] === 'true';

  if (swaggerEnabled) {
    const apiUrl  = config.get<string>('app.apiUrl') ?? 'http://localhost:3001';

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Elorge Partner Payout API')
      .setDescription(`
## Overview

The **Elorge Partner Payout API** enables partners to send Nigerian Naira (NGN)
directly to any Nigerian bank account via the NIBSS Instant Payment (NIP) network.

---

## How It Works

Elorge operates a **Naira-pipe model** — partners handle their own FX entirely:

1. Partner converts foreign currency to NGN using their own FX engine
2. Partner funds their **Elorge Naira wallet** by wiring NGN to their dedicated
   Virtual Account Number (VAN)
3. Partner calls \`POST /v1/payouts\` with the final NGN amount in kobo
4. Elorge delivers the exact NGN amount to the recipient's Nigerian bank account
5. Elorge deducts the payout amount + platform fee from the partner's wallet

**Elorge never touches FX rates.** The \`exchangeRateAudit\` field is optional
and stored only for the partner's own reconciliation records.

---

## Wallet Funding

Each partner receives a dedicated Nigerian bank account (VAN) at onboarding.
Wire NGN to this account — funds are credited to your wallet automatically
within minutes via Flutterwave webhook.

Your VAN details are shown in the dashboard under **Overview → Naira Wallet**.

---

## Authentication

### Partner API (payouts, webhooks)
All \`/v1/*\` endpoints require an API key in the \`Authorization\` header:
\`\`\`
Authorization: Bearer el_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
\`\`\`
Use \`el_test_\` prefixed keys for sandbox testing.

### Dashboard (admin/partner UI)
The dashboard uses session-based JWT auth via \`POST /auth/login\`.

---

## Amounts — Always in Kobo

All monetary amounts use **kobo** (integer) to avoid floating-point errors:

| NGN Amount | kobo value |
|-----------|------------|
| ₦100.00   | 10000      |
| ₦1,000.00 | 100000     |
| ₦250,000.00 | 25000000 |

---

## Fee Schedule

Fees are deducted from the partner wallet alongside the payout amount

| Payout Amount     | Platform Fee |
|-------------------|-------------|
| ≤ ₦50,000         | ₦150        |
| ≤ ₦200,000        | ₦250        |
| ≤ ₦1,000,000      | ₦400        |
| > ₦1,000,000      | ₦600        |

---

## Webhook Events

Subscribe to payout lifecycle events via \`POST /v1/webhooks\`:

| Event               | Fired when                              |
|---------------------|-----------------------------------------|
| \`payout.processing\` | Payout dispatched to Flutterwave        |
| \`payout.delivered\`  | NGN credited to recipient's bank        |
| \`payout.failed\`     | All retry attempts exhausted            |
| \`payout.flagged\`    | Payout held for compliance review       |

All webhook payloads are signed with HMAC-SHA256.
Verify with the \`X-Elorge-Signature\` header.
      `)
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'API Key' },
        'api-key',
      )
      .addServer(apiUrl, 'Current Server')
      .addServer('http://localhost:3001', 'Local Development')
      .setContact('Elorge Support', 'https://elorge.com', 'support@elorge.com')
      .setLicense('Proprietary', 'https://elorge.com/terms')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Elorge API Docs',
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter:           'alpha',
        operationsSorter:     'alpha',
        docExpansion:         'none',
        filter:               true,
      },
    });

    logger.log(`Swagger docs: ${apiUrl}/api/docs`);
  }

  // ── Start ─────────────────────────────────────────────────
  const port = config.get<number>('app.port') ?? 3001;
  await app.listen(port, '0.0.0.0');

  const prisma = app.get(PrismaService);
  await prisma.testConnection();

  logger.log(`🚀 API running on port ${port}`);
  logger.log(`🌍 Environment: ${config.get<string>('app.nodeEnv')}`);
}

void bootstrap();