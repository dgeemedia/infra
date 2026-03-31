import type { Currency, PayoutStatus } from '@elorge/constants';
export interface RecipientDetails {
    fullName: string;
    bankCode: string;
    accountNumber: string;
    phone?: string;
}
export interface SenderDetails {
    fullName: string;
    country: string;
    externalId?: string;
}
export interface PayoutRequest {
    partnerReference: string;
    sendAmount: number;
    sendCurrency: Currency;
    recipient: RecipientDetails;
    sender: SenderDetails;
    narration?: string;
}
export interface PayoutResponse {
    payoutId: string;
    partnerReference: string;
    status: PayoutStatus;
    nairaAmount: number;
    exchangeRate: number;
    fee: number;
    estimatedDelivery: string;
    createdAt: string;
}
export interface PayoutRecord extends PayoutResponse {
    partnerId: string;
    pspReference?: string;
    failureReason?: string;
    deliveredAt?: string;
    updatedAt: string;
}
export interface PayoutStatusResponse {
    payoutId: string;
    partnerReference: string;
    status: PayoutStatus;
    nairaAmount: number;
    deliveredAt?: string;
    failureReason?: string;
    pspReference?: string;
    bankSessionId?: string;
}
export interface PayoutListResponse {
    data: PayoutRecord[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
export interface PayoutFilters {
    status?: PayoutStatus;
    currency?: Currency;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
    search?: string;
}
//# sourceMappingURL=payout.types.d.ts.map