// apps/api/src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port:    parseInt(process.env['PORT'] ?? '3001', 10),
  name:    process.env['PLATFORM_NAME'] ?? 'Elorge Payout Platform',
  email:   process.env['PLATFORM_EMAIL'] ?? 'platform@elorge.com',
  support: process.env['SUPPORT_EMAIL']  ?? 'support@elorge.com',

  apiKeyPrefix:        process.env['API_KEY_PREFIX']         ?? 'el_live_',
  apiKeySandboxPrefix: process.env['API_KEY_SANDBOX_PREFIX'] ?? 'el_test_',

  jwtSecret:    process.env['JWT_SECRET']    ?? 'change_this_in_production',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d',

  webhookSecret:       process.env['WEBHOOK_SECRET']            ?? 'change_this',
  webhookMaxRetries:   parseInt(process.env['WEBHOOK_MAX_RETRIES']    ?? '5',    10),
  webhookRetryDelayMs: parseInt(process.env['WEBHOOK_RETRY_DELAY_MS'] ?? '5000', 10),

  // ── Platform fee ─────────────────────────────────────────
  // Default fee for override/testing. In production, the fee is
  // calculated by calculateFeeKobo() in payouts.service.ts based
  // on payout amount tiers.
  platformFeeKobo: parseInt(process.env['PLATFORM_FEE_KOBO'] ?? '25000', 10), // ₦250

  // ── Minimum balance requirement ───────────────────────────
  // Partners must keep this much kobo in their wallet after a
  // payout is deducted. 0 = no floor. Raise to require a buffer.
  minPartnerBalanceKobo: parseInt(process.env['MIN_PARTNER_BALANCE_KOBO'] ?? '0', 10),

  // ── Payout naira limits ───────────────────────────────────
  minPayoutKobo: parseInt(process.env['MIN_PAYOUT_KOBO'] ?? '10000',      10), // ₦100
  maxPayoutKobo: parseInt(process.env['MAX_PAYOUT_KOBO'] ?? '5000000000', 10), // ₦50,000,000
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env['DATABASE_URL'],
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
}));

export const pspConfig = registerAs('psp', () => ({
  flutterwave: {
    secretKey:   process.env['FLUTTERWAVE_SECRET_KEY'],
    baseUrl:     process.env['FLUTTERWAVE_BASE_URL'] ?? 'https://api.flutterwave.com/v3',
    // Secret Hash set in Flutterwave dashboard → Settings → Webhooks
    // Must match exactly what you enter there.
    webhookHash: process.env['FLUTTERWAVE_WEBHOOK_HASH'],
  },
}));

export const complianceConfig = registerAs('compliance', () => ({
  openSanctions: {
    apiKey: process.env['OPEN_SANCTIONS_API_KEY'],
  },
}));