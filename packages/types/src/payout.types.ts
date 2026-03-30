// packages/types/src/payout.types.ts
import type { Currency, PayoutStatus } from '@elorge/constants';

// ── Recipient ──────────────────────────────────────────────
export interface RecipientDetails {
  fullName:      string;
  bankCode:      string;  // 3-6 digit CBN bank code e.g. '058' for GTBank
  accountNumber: string;  // 10-digit NUBAN account number
  phone?:        string;  // Nigerian mobile e.g. +2348012345678
}

// ── Sender ────────────────────────────────────────────────
export interface SenderDetails {
  fullName:    string;
  country:     string;  // ISO 3166-1 alpha-2 e.g. 'GB'
  externalId?: string;  // partner's internal user ID for reference
}

// ── Payout Request (what FinestPay sends to Elorge) ───────
export interface PayoutRequest {
  partnerReference: string;         // unique ID from the partner's system
  sendAmount:       number;         // amount in sending currency (e.g. 100 GBP)
  sendCurrency:     Currency;       // 'GBP' | 'USD' | 'EUR' | 'CAD'
  recipient:        RecipientDetails;
  sender:           SenderDetails;
  narration?:       string;         // optional description on bank statement
}

// ── Payout Response (what Elorge returns) ─────────────────
export interface PayoutResponse {
  payoutId:          string;        // Elorge's unique payout ID e.g. ELG_PAY_xxx
  partnerReference:  string;        // echoed back from request
  status:            PayoutStatus;
  nairaAmount:       number;        // calculated NGN amount
  exchangeRate:      number;        // rate used e.g. 2050.45
  fee:               number;        // fee in sending currency
  estimatedDelivery: string;        // 'same_day' | 'next_day'
  createdAt:         string;        // ISO 8601 timestamp
}

// ── Payout Record (full DB record returned by API) ────────
export interface PayoutRecord extends PayoutResponse {
  partnerId:       string;
  pspReference?:   string;         // PSP's own transaction reference
  failureReason?:  string;         // populated if status is FAILED
  deliveredAt?:    string;         // ISO 8601 timestamp when delivered
  updatedAt:       string;
}

// ── Status Check Response ─────────────────────────────────
export interface PayoutStatusResponse {
  payoutId:         string;
  partnerReference: string;
  status:           PayoutStatus;
  nairaAmount:      number;
  deliveredAt?:     string;
  failureReason?:   string;
  pspReference?:    string;
  bankSessionId?:   string;        // NIP session ID from NIBSS
}

// ── List Payouts Response ─────────────────────────────────
export interface PayoutListResponse {
  data:       PayoutRecord[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

// ── Payout Filters (for dashboard queries) ────────────────
export interface PayoutFilters {
  status?:     PayoutStatus;
  currency?:   Currency;
  startDate?:  string;
  endDate?:    string;
  page?:       number;
  pageSize?:   number;
  search?:     string;  // search by reference or recipient name
}
