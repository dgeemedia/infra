// packages/types/src/payout.types.d.ts
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
export interface PayoutResponse {
    id:                string;
    partnerReference:  string;
    status:            PayoutStatus;
    nairaAmountKobo:   number;
    feeKobo:           number;
    exchangeRateAudit: number | null;
    estimatedDelivery: string;
    createdAt:         string;
}
export interface PayoutRecord extends PayoutResponse {
    partnerId:      string;
    pspReference?:  string;
    failureReason?: string;
    narration?:     string;
    deliveredAt?:   string;
    updatedAt:      string;
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
//# sourceMappingURL=payout.types.d.ts.map