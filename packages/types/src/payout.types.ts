// packages/types/src/payout.types.ts
import type { Currency, PayoutStatus } from '@elorge/constants';

export interface RecipientDetails {
  fullName:      string;
  bankCode:      string;
  accountNumber: string;
  phone?:        string;
}

export interface SenderDetails {
  fullName:    string;
  country:     string;
  externalId?: string;
}

export interface PayoutRequest {
  partnerReference: string;
  sendAmount:       number;
  sendCurrency:     Currency;
  recipient:        RecipientDetails;
  sender:           SenderDetails;
  narration?:       string;
}

// ── What the API returns immediately after creating a payout ──
export interface PayoutResponse {
  id:                string;        // Payout.id (UUID)
  partnerReference:  string;
  status:            PayoutStatus;
  nairaAmountKobo:   number;        // stored in kobo, divide by 100 for display
  feeKobo:           number;
  exchangeRateAudit: number | null; // Decimal in DB, null if not yet set
  estimatedDelivery: string;
  createdAt:         string;
}

// ── Full DB record returned by list/status endpoints ─────────
export interface PayoutRecord extends PayoutResponse {
  partnerId:       string;
  pspReference?:   string;
  failureReason?:  string;
  narration?:      string;
  deliveredAt?:    string;
  updatedAt:       string;
  recipient: {
    fullName:      string;
    bankCode:      string;
    bankName:      string;
    accountNumber: string;
    phone?:        string;
  } | null;
}

export interface PayoutStatusResponse {
  id:               string;
  partnerReference: string;
  status:           PayoutStatus;
  nairaAmountKobo:  number;
  deliveredAt?:     string;
  failureReason?:   string;
  pspReference?:    string;
  bankSessionId?:   string;
}

export interface PayoutListResponse {
  data:       PayoutRecord[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface PayoutFilters {
  status?:    PayoutStatus;
  currency?:  Currency;
  startDate?: string;
  endDate?:   string;
  page?:      number;
  pageSize?:  number;
  search?:    string;
}