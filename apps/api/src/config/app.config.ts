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

  // ── Platform fee (Naira) ─────────────────────────────────
  // Flat naira fee charged per payout. Partners keep their FX margin;
  // Elorge earns only this naira spread per disbursement.
  // Set via env to adjust without code changes.
  platformFeeKobo: parseInt(process.env['PLATFORM_FEE_KOBO'] ?? '50000', 10), // default ₦500

  // ── Minimum partner naira balance before payouts are blocked ──
  // If balance (kobo) drops below this after deducting the payout
  // amount + fee, the API rejects the request until they top up.
  minPartnerBalanceKobo: parseInt(process.env['MIN_PARTNER_BALANCE_KOBO'] ?? '0', 10),

  // ── Per-payout naira limits ──────────────────────────────
  minPayoutNaira: parseInt(process.env['MIN_PAYOUT_NAIRA'] ?? '1000',       10), // ₦1,000
  maxPayoutNaira: parseInt(process.env['MAX_PAYOUT_NAIRA'] ?? '50000000',   10), // ₦50,000,000
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env['DATABASE_URL'],
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
}));

export const pspConfig = registerAs('psp', () => ({
  flutterwave: {
    secretKey: process.env['FLUTTERWAVE_SECRET_KEY'],
    baseUrl:   process.env['FLUTTERWAVE_BASE_URL'] ?? 'https://api.flutterwave.com/v3',
  },
}));

export const complianceConfig = registerAs('compliance', () => ({
  openSanctions: {
    apiKey: process.env['OPEN_SANCTIONS_API_KEY'],
  },
}));