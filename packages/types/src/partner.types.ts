// ── Partner ────────────────────────────────────────────────
export interface Partner {
  id:          string;
  name:        string;        // e.g. 'FinestPay UK'
  email:       string;        // primary contact email
  country:     string;        // ISO 3166-1 alpha-2 e.g. 'GB'
  status:      PartnerStatus;
  webhookUrl?: string;        // partner's registered webhook endpoint
  createdAt:   string;
  updatedAt:   string;
}

export type PartnerStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';

// ── API Key ────────────────────────────────────────────────
export interface ApiKey {
  id:          string;
  partnerId:   string;
  label:       string;        // human-readable name e.g. 'Production Key'
  keyPreview:  string;        // masked key e.g. 'el_live_xxxx...abc'
  environment: 'live' | 'sandbox';
  lastUsedAt?: string;
  createdAt:   string;
  revokedAt?:  string;        // null if still active
}

// ── Shown only once at creation ───────────────────────────
export interface ApiKeyCreated extends ApiKey {
  fullKey: string;            // only returned once — store it securely
}

// ── Webhook Config ─────────────────────────────────────────
export interface WebhookConfig {
  id:        string;
  partnerId: string;
  url:       string;
  events:    WebhookEventType[];
  isActive:  boolean;
  secret:    string;          // HMAC secret for signature verification
  createdAt: string;
  updatedAt: string;
}

export type WebhookEventType =
  | 'payout.delivered'
  | 'payout.failed'
  | 'payout.processing'
  | 'payout.flagged';

// ── Partner Stats (for dashboard overview) ─────────────────
export interface PartnerStats {
  totalPayouts:       number;
  successfulPayouts:  number;
  failedPayouts:      number;
  totalVolumeGbp:     number;
  totalVolumaNgn:     number;
  successRate:        number;  // percentage 0-100
  todayPayouts:       number;
  todayVolumeGbp:     number;
}

// ── Create / Update DTOs ──────────────────────────────────
export interface CreatePartnerDto {
  name:    string;
  email:   string;
  country: string;
}

export interface CreateApiKeyDto {
  label:       string;
  environment: 'live' | 'sandbox';
}

export interface RegisterWebhookDto {
  url:    string;
  events: WebhookEventType[];
}
