// packages/constants/src/payout-status.d.ts
export declare enum PayoutStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    DELIVERED = "DELIVERED",
    FAILED = "FAILED",
    FLAGGED = "FLAGGED"
}
export declare const TERMINAL_STATUSES: PayoutStatus[];
export declare const SUCCESS_STATUSES: PayoutStatus[];
export declare const RETRYABLE_STATUSES: PayoutStatus[];
export declare const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string>;
export declare const PAYOUT_STATUS_COLORS: Record<PayoutStatus, string>;
//# sourceMappingURL=payout-status.d.ts.map