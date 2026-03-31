export interface Partner {
    id: string;
    name: string;
    email: string;
    country: string;
    status: PartnerStatus;
    webhookUrl?: string;
    createdAt: string;
    updatedAt: string;
}
export interface AuthenticatedPartner {
    id: string;
    name: string;
    email: string;
    country: string;
    status: PartnerStatus;
    apiKeyId: string;
    environment: 'live' | 'sandbox';
}
export type PartnerStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW';
export interface ApiKey {
    id: string;
    partnerId: string;
    label: string;
    keyPreview: string;
    environment: 'live' | 'sandbox';
    lastUsedAt?: string;
    createdAt: string;
    revokedAt?: string;
}
export interface ApiKeyCreated extends ApiKey {
    fullKey: string;
}
export interface WebhookConfig {
    id: string;
    partnerId: string;
    url: string;
    events: WebhookEventType[];
    isActive: boolean;
    secret: string;
    createdAt: string;
    updatedAt: string;
}
export type WebhookEventType = 'payout.delivered' | 'payout.failed' | 'payout.processing' | 'payout.flagged';
export interface PartnerStats {
    totalPayouts: number;
    successfulPayouts: number;
    failedPayouts: number;
    totalVolumeGbp: number;
    totalVolumaNgn: number;
    successRate: number;
    todayPayouts: number;
    todayVolumeGbp: number;
}
export interface CreatePartnerDto {
    name: string;
    email: string;
    country: string;
}
export interface CreateApiKeyDto {
    label: string;
    environment: 'live' | 'sandbox';
}
export interface RegisterWebhookDto {
    url: string;
    events: WebhookEventType[];
}
//# sourceMappingURL=partner.types.d.ts.map