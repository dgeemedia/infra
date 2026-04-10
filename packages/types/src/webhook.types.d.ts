// packages/types/src/webhook.types.d.ts
import type { WebhookEventType } from './partner.types';
import type { PayoutStatus } from '@elorge/constants';
export interface WebhookPayload {
    id: string;
    event: WebhookEventType;
    payoutId: string;
    partnerReference: string;
    status: PayoutStatus;
    nairaAmount: number;
    deliveredAt?: string;
    failureReason?: string;
    timestamp: string;
    signature: string;
}
export interface WebhookDelivery {
    id: string;
    payoutId: string;
    webhookId: string;
    url: string;
    payload: WebhookPayload;
    responseCode: number | null;
    responseBody: string | null;
    attempt: number;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    nextRetryAt?: string;
    createdAt: string;
}
export interface ApiErrorResponse {
    statusCode: number;
    error: string;
    message: string;
    code: string;
    timestamp: string;
    path: string;
}
//# sourceMappingURL=webhook.types.d.ts.map