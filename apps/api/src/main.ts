// apps/api/src/main.ts
import { NestFactory }          from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService }         from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule }                  from './app.module';
import { GlobalExceptionFilter }      from './common/filters/global-exception.filter';
import { LoggingInterceptor }         from './common/interceptors/logging.interceptor';
import { TransformInterceptor }       from './common/interceptors/transform.interceptor';
import { PrismaService }              from './database/prisma.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app    = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  // ── CORS ────────────────────────────────────────────────
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://dashboard.elorge.com',
      'https://sandbox-dashboard.elorge.com',
    ],
    methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders:   ['Content-Type', 'Authorization'],
    credentials:      true,
  });

  // ── Global Prefix ────────────────────────────────────────
  app.setGlobalPrefix('', { exclude: ['health'] });

  // ── Global Pipes ─────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,
      forbidNonWhitelisted: true,
      transform:            true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global Filters ───────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Global Interceptors ──────────────────────────────────
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // ── Swagger API Documentation ────────────────────────────
  const swaggerEnabled =
    process.env['NODE_ENV'] !== 'production' ||
    process.env['SWAGGER_ENABLED'] === 'true';
    
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Elorge Partner Payout API')
      .setDescription(
        `
        The Elorge Partner Payout Platform API.

        Use this API to initiate Nigerian Naira payouts, check payout status,
        get live exchange rates, and manage webhook subscriptions.

        **Authentication:** All /v1/* endpoints require an API key in the Authorization header:
        \`Authorization: Bearer el_live_your_api_key\`

        **Sandbox:** Use \`el_test_\` prefixed keys and point to:
        https://sandbox.elorge.com
        `,
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addServer('http://localhost:3001', 'Local Development')
      .addServer('https://sandbox.elorge.com', 'Sandbox')
      .addServer('https://api.elorge.com', 'Production')
      .setContact('Elorge Support', 'https://elorge.com', 'support@elorge.com')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter:           'alpha',
        operationsSorter:     'alpha',
      },
    });

    logger.log('Swagger docs available at: /api/docs');
  }

  // ── Start Server ─────────────────────────────────────────
  const port = config.get<number>('app.port') ?? 3001;
  await app.listen(port, '0.0.0.0');

  // ── Database connection check ─────────────────────────────
  const prisma = app.get(PrismaService);
  await prisma.testConnection();

  logger.log(`🚀 Elorge API running on port ${port}`);
  logger.log(`📖 Swagger: http://localhost:${port}/api/docs`);
  logger.log(`🌍 Environment: ${config.get<string>('app.nodeEnv')}`);
}

void bootstrap();