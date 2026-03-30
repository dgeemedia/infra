// packages/types/src/fx.types.ts
import type { Currency } from '@elorge/constants';

// ── Rate Quote ────────────────────────────────────────────
export interface FxQuote {
  fromCurrency:   Currency;
  toCurrency:     Currency;     // always NGN for Elorge
  sendAmount:     number;       // amount partner is sending
  exchangeRate:   number;       // e.g. 2050.45 GBP/NGN
  fee:            number;       // Elorge fee in send currency
  recipientGets:  number;       // final NGN amount after fee
  rateExpiresAt:  string;       // ISO 8601 — rate is locked until this time
}

// ── Rate Response (GET /v1/rates) ─────────────────────────
export interface RateResponse {
  quote:           FxQuote;
  indicativeOnly:  boolean;     // true = rate may change; false = locked rate
}

// ── Internal rate from provider ───────────────────────────
export interface RawExchangeRate {
  base:      string;
  rates:     Record<string, number>;
  timestamp: number;
}
