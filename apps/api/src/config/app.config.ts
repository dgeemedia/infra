// apps/api/src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv:   process.env.NODE_ENV ?? 'development',
  port:      parseInt(process.env.PORT ?? '3001', 10),
  name:      process.env.PLATFORM_NAME ?? 'Elorge Payout Platform',
  email:     process.env.PLATFORM_EMAIL ?? 'platform@elorge.com',
  support:   process.env.SUPPORT_EMAIL  ?? 'support@elorge.com',

  // Payout limits
  maxPayoutGbp: parseFloat(process.env.MAX_PAYOUT_AMOUNT_GBP ?? '5000'),
  minPayoutGbp: parseFloat(process.env.MIN_PAYOUT_AMOUNT_GBP ?? '1'),

  // API key config
  apiKeyPrefix:        process.env.API_KEY_PREFIX         ?? 'el_live_',
  apiKeySandboxPrefix: process.env.API_KEY_SANDBOX_PREFIX ?? 'el_test_',

  // JWT
  jwtSecret:    process.env.JWT_SECRET    ?? 'change_this_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',

  // Webhook
  webhookSecret:       process.env.WEBHOOK_SECRET           ?? 'change_this',
  webhookMaxRetries:   parseInt(process.env.WEBHOOK_MAX_RETRIES   ?? '5',    10),
  webhookRetryDelayMs: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS ?? '5000', 10),
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const redisConfig = registerAs('redis', () => ({
  url:         process.env.REDIS_URL ?? 'redis://localhost:6379',
  fxCacheTtl:  parseInt(process.env.FX_CACHE_TTL_SECONDS ?? '300', 10),
}));

export const pspConfig = registerAs('psp', () => ({
  bankly: {
    clientId:      process.env.BANKLY_CLIENT_ID,
    clientSecret:  process.env.BANKLY_CLIENT_SECRET,
    baseUrl:       process.env.BANKLY_BASE_URL      ?? 'https://api.bankly.ng',
    walletAccount: process.env.BANKLY_WALLET_ACCOUNT,
  },
  flutterwave: {
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
    baseUrl:   process.env.FLUTTERWAVE_BASE_URL ?? 'https://api.flutterwave.com/v3',
  },
}));

export const fxConfig = registerAs('fx', () => ({
  openExchangeRatesAppId: process.env.OPEN_EXCHANGE_RATES_APP_ID,
  cacheTtlSeconds:        parseInt(process.env.FX_CACHE_TTL_SECONDS ?? '300', 10),
}));

export const complianceConfig = registerAs('compliance', () => ({
  complyAdvantage: {
    apiKey:  process.env.COMPLY_ADVANTAGE_API_KEY,
    baseUrl: process.env.COMPLY_ADVANTAGE_BASE_URL ?? 'https://api.complyadvantage.com',
  },
  openSanctions: {
    apiKey: process.env.OPEN_SANCTIONS_API_KEY,
  },
}));
