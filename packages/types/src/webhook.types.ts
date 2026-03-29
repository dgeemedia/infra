import type { WebhookEventType } from './partner.types';
import type { PayoutStatus } from '@elorge/constants';

// ── Webhook Payload (fired to partner endpoint) ────────────
export interface WebhookPayload {
  id:               string;           // unique webhook delivery ID
  event:            WebhookEventType;
  payoutId:         string;
  partnerReference: string;
  status:           PayoutStatus;
  nairaAmount:      number;
  deliveredAt?:     string;
  failureReason?:   string;
  timestamp:        string;           // ISO 8601 when this event was fired
  signature:        string;           // HMAC-SHA256 of payload for verification
}

// ── Webhook Delivery Log ───────────────────────────────────
export interface WebhookDelivery {
  id:           string;
  payoutId:     string;
  webhookId:    string;
  url:          string;
  payload:      WebhookPayload;
  responseCode: number | null;
  responseBody: string | null;
  attempt:      number;
  status:       'SUCCESS' | 'FAILED' | 'PENDING';
  nextRetryAt?: string;
  createdAt:    string;
}

// ── Standard API error response ───────────────────────────
export interface ApiErrorResponse {
  statusCode: number;
  error:      string;
  message:    string;
  code:       string;   // Elorge error code e.g. 'ELG_001'
  timestamp:  string;
  path:       string;
}
