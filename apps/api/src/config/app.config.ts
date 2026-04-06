// apps/api/src/config/app.config.ts
import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv:   process.env['NODE_ENV'] ?? 'development',
  port:      parseInt(process.env['PORT'] ?? '3001', 10),
  name:      process.env['PLATFORM_NAME'] ?? 'Elorge Payout Platform',
  email:     process.env['PLATFORM_EMAIL'] ?? 'platform@elorge.com',
  support:   process.env['SUPPORT_EMAIL']  ?? 'support@elorge.com',

  maxPayoutGbp: parseFloat(process.env['MAX_PAYOUT_AMOUNT_GBP'] ?? '5000'),
  minPayoutGbp: parseFloat(process.env['MIN_PAYOUT_AMOUNT_GBP'] ?? '1'),

  apiKeyPrefix:        process.env['API_KEY_PREFIX']         ?? 'el_live_',
  apiKeySandboxPrefix: process.env['API_KEY_SANDBOX_PREFIX'] ?? 'el_test_',

  jwtSecret:    process.env['JWT_SECRET']    ?? 'change_this_in_production',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d',

  webhookSecret:       process.env['WEBHOOK_SECRET']            ?? 'change_this',
  webhookMaxRetries:   parseInt(process.env['WEBHOOK_MAX_RETRIES']    ?? '5',    10),
  webhookRetryDelayMs: parseInt(process.env['WEBHOOK_RETRY_DELAY_MS'] ?? '5000', 10),

  // ── Platform fee tiers (GBP) ─────────────────────────────
  feeT1Max: parseFloat(process.env['FEE_TIER1_MAX_GBP'] ?? '50'),
  feeT2Max: parseFloat(process.env['FEE_TIER2_MAX_GBP'] ?? '200'),
  feeT3Max: parseFloat(process.env['FEE_TIER3_MAX_GBP'] ?? '500'),
  feeT1:    parseFloat(process.env['FEE_TIER1_GBP']     ?? '1.99'),
  feeT2:    parseFloat(process.env['FEE_TIER2_GBP']     ?? '2.99'),
  feeT3:    parseFloat(process.env['FEE_TIER3_GBP']     ?? '3.99'),
  feeT4:    parseFloat(process.env['FEE_TIER4_GBP']     ?? '4.99'),

  // ── Minimum partner balance before payouts are blocked ───
  // If a partner's balance drops below this threshold (in GBP),
  // the API rejects new payouts until they top up.
  minPartnerBalanceGbp: parseFloat(process.env['MIN_PARTNER_BALANCE_GBP'] ?? '0'),
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env['DATABASE_URL'],
}));

export const redisConfig = registerAs('redis', () => ({
  url:        process.env['REDIS_URL'] ?? 'redis://localhost:6379',
  fxCacheTtl: parseInt(process.env['FX_CACHE_TTL_SECONDS'] ?? '300', 10),
}));

export const pspConfig = registerAs('psp', () => ({
  bankly: {
    clientId:      process.env['BANKLY_CLIENT_ID'],
    clientSecret:  process.env['BANKLY_CLIENT_SECRET'],
    baseUrl:       process.env['BANKLY_BASE_URL']      ?? 'https://api.bankly.ng',
    walletAccount: process.env['BANKLY_WALLET_ACCOUNT'],
  },
  flutterwave: {
    secretKey: process.env['FLUTTERWAVE_SECRET_KEY'],
    baseUrl:   process.env['FLUTTERWAVE_BASE_URL'] ?? 'https://api.flutterwave.com/v3',
  },
}));

export const fxConfig = registerAs('fx', () => ({
  openExchangeRatesAppId: process.env['OPEN_EXCHANGE_RATES_APP_ID'],
  cacheTtlSeconds:        parseInt(process.env['FX_CACHE_TTL_SECONDS'] ?? '300', 10),
}));

export const complianceConfig = registerAs('compliance', () => ({
  openSanctions: {
    apiKey: process.env['OPEN_SANCTIONS_API_KEY'],
  },
}));

// ── Receiving account config (your payment details) ──────────
// Used to populate the "How to pay your invoice" section in
// partner-facing invoice emails. Swap provider any time by
// updating .env — no code change needed.
//
// RECEIVING_PROVIDER  — free-text name shown to partners
//                       e.g. "Wise", "Payoneer", "Airwallex"
// Each currency block has: ACCOUNT_NAME, ACCOUNT_NUMBER,
// ROUTING (sort code / ACH routing / IBAN etc), SWIFT_BIC.
// Add or remove currency blocks as your provider supports them.
export const receivingAccountConfig = registerAs('receivingAccount', () => ({
  provider: process.env['RECEIVING_PROVIDER'] ?? 'Wise',

  gbp: {
    accountName:  process.env['RECEIVING_GBP_ACCOUNT_NAME']  ?? '',
    accountNumber:process.env['RECEIVING_GBP_ACCOUNT_NUMBER']?? '',
    sortCode:     process.env['RECEIVING_GBP_SORT_CODE']     ?? '',
    swiftBic:     process.env['RECEIVING_GBP_SWIFT_BIC']     ?? '',
    iban:         process.env['RECEIVING_GBP_IBAN']          ?? '',
  },

  usd: {
    accountName:    process.env['RECEIVING_USD_ACCOUNT_NAME']     ?? '',
    accountNumber:  process.env['RECEIVING_USD_ACCOUNT_NUMBER']   ?? '',
    achRouting:     process.env['RECEIVING_USD_ACH_ROUTING']      ?? '',
    wireRouting:    process.env['RECEIVING_USD_WIRE_ROUTING']      ?? '',
    swiftBic:       process.env['RECEIVING_USD_SWIFT_BIC']        ?? '',
    // Note: wire routing differs from ACH on Wise — set both
  },

  eur: {
    accountName:   process.env['RECEIVING_EUR_ACCOUNT_NAME']  ?? '',
    iban:          process.env['RECEIVING_EUR_IBAN']          ?? '',
    swiftBic:      process.env['RECEIVING_EUR_SWIFT_BIC']     ?? '',
  },

  cad: {
    accountName:       process.env['RECEIVING_CAD_ACCOUNT_NAME']         ?? '',
    accountNumber:     process.env['RECEIVING_CAD_ACCOUNT_NUMBER']       ?? '',
    institutionNumber: process.env['RECEIVING_CAD_INSTITUTION_NUMBER']   ?? '',
    transitNumber:     process.env['RECEIVING_CAD_TRANSIT_NUMBER']       ?? '',
    swiftBic:          process.env['RECEIVING_CAD_SWIFT_BIC']            ?? '',
  },
}));