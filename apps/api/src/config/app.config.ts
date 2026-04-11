// apps/api/src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port:    parseInt(process.env['PORT'] ?? '3001', 10),
  name:    process.env['PLATFORM_NAME']  ?? 'Elorge Payout Platform',
  email:   process.env['PLATFORM_EMAIL'] ?? 'platform@elorge.com',
  support: process.env['SUPPORT_EMAIL']  ?? 'support@elorge.com',

  apiKeyPrefix:        process.env['API_KEY_PREFIX']         ?? 'el_live_',
  apiKeySandboxPrefix: process.env['API_KEY_SANDBOX_PREFIX'] ?? 'el_test_',

  jwtSecret:    process.env['JWT_SECRET']     ?? 'change_this_in_production',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d',

  webhookSecret:       process.env['WEBHOOK_SECRET']              ?? 'change_this',
  webhookMaxRetries:   parseInt(process.env['WEBHOOK_MAX_RETRIES']    ?? '5',    10),
  webhookRetryDelayMs: parseInt(process.env['WEBHOOK_RETRY_DELAY_MS'] ?? '5000', 10),

  // ── Platform fee tiers ────────────────────────────────────
  // Each tier: maxKobo = upper bound of payout amount (Infinity for last tier)
  // feeKobo = flat fee charged for payouts in that tier
  // Change these in .env — no code changes needed to reprice.
  feeTiers: [
    {
      maxKobo: parseInt(process.env['FEE_TIER1_MAX_KOBO'] ?? '5000000',   10), // ₦50,000
      feeKobo: parseInt(process.env['FEE_TIER1_FEE_KOBO'] ?? '15000',     10), // ₦150
    },
    {
      maxKobo: parseInt(process.env['FEE_TIER2_MAX_KOBO'] ?? '20000000',  10), // ₦200,000
      feeKobo: parseInt(process.env['FEE_TIER2_FEE_KOBO'] ?? '25000',     10), // ₦250
    },
    {
      maxKobo: parseInt(process.env['FEE_TIER3_MAX_KOBO'] ?? '100000000', 10), // ₦1,000,000
      feeKobo: parseInt(process.env['FEE_TIER3_FEE_KOBO'] ?? '40000',     10), // ₦400
    },
    {
      maxKobo: Infinity,
      feeKobo: parseInt(process.env['FEE_TIER4_FEE_KOBO'] ?? '60000',     10), // ₦600
    },
  ],

  // ── Fallback single fee (used by VAN notification estimate) ──
  platformFeeKobo: parseInt(process.env['FEE_TIER2_FEE_KOBO'] ?? '25000', 10),

  // ── Minimum balance requirement ───────────────────────────
  minPartnerBalanceKobo: parseInt(process.env['MIN_PARTNER_BALANCE_KOBO'] ?? '0', 10),

  // ── Payout naira limits ───────────────────────────────────
  minPayoutKobo: parseInt(process.env['MIN_PAYOUT_KOBO'] ?? '10000',      10), // ₦100
  maxPayoutKobo: parseInt(process.env['MAX_PAYOUT_KOBO'] ?? '5000000000', 10), // ₦50,000,000

  // ── CORS ──────────────────────────────────────────────────
  corsOrigins: process.env['CORS_ORIGINS'] ?? 'http://localhost:3000',

  // ── Swagger / API URL ─────────────────────────────────────
  apiUrl:         process.env['APP_API_URL']       ?? 'http://localhost:3001',
  swaggerEnabled: process.env['SWAGGER_ENABLED']   ?? 'false',
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
    webhookHash: process.env['FLUTTERWAVE_WEBHOOK_HASH'],
  },
}));

export const complianceConfig = registerAs('compliance', () => ({
  openSanctions: {
    apiKey: process.env['OPEN_SANCTIONS_API_KEY'],
  },
}));