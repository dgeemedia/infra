// apps/api/src/main.ts
import { NestFactory }          from '@nestjs/core';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService }         from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule }                  from './app.module';
import { GlobalExceptionFilter }      from './common/filters/global-exception.filter';
import { LoggingInterceptor }         from './common/interceptors/logging.interceptor';
import { TransformInterceptor }       from './common/interceptors/transform.interceptor';

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
  // Note: /v1/ is set at controller level for flexibility
  app.setGlobalPrefix('', { exclude: ['health'] });

  // ── Global Pipes ─────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:            true,       // strip unknown properties
      forbidNonWhitelisted: true,       // throw if unknown properties sent
      transform:            true,       // auto-transform payloads to DTO instances
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
  if (config.get<string>('app.nodeEnv') !== 'production') {
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

  logger.log(`🚀 Elorge API running on port ${port}`);
  logger.log(`📖 Swagger: http://localhost:${port}/api/docs`);
  logger.log(`🌍 Environment: ${config.get<string>('app.nodeEnv')}`);
}

void bootstrap();
