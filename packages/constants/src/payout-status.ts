// packages/constants/src/payout-status.ts
export enum PayoutStatus {
  PENDING    = 'PENDING',     // received, compliance check in progress
  PROCESSING = 'PROCESSING',  // compliance passed, sent to PSP
  DELIVERED  = 'DELIVERED',   // Naira credited to recipient account
  FAILED     = 'FAILED',      // bank transfer rejected or error
  FLAGGED    = 'FLAGGED',     // sanctions hold — needs manual review
}

// Terminal statuses — no further state changes expected
export const TERMINAL_STATUSES: PayoutStatus[] = [
  PayoutStatus.DELIVERED,
  PayoutStatus.FAILED,
];

// Statuses considered successful for reporting
export const SUCCESS_STATUSES: PayoutStatus[] = [
  PayoutStatus.DELIVERED,
];

// Statuses that can be retried
export const RETRYABLE_STATUSES: PayoutStatus[] = [
  PayoutStatus.FAILED,
];

// Human-readable labels for dashboard display
export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  [PayoutStatus.PENDING]:    'Pending',
  [PayoutStatus.PROCESSING]: 'Processing',
  [PayoutStatus.DELIVERED]:  'Delivered',
  [PayoutStatus.FAILED]:     'Failed',
  [PayoutStatus.FLAGGED]:    'Under Review',
};

// Colour classes for dashboard badges (Tailwind-compatible)
export const PAYOUT_STATUS_COLORS: Record<PayoutStatus, string> = {
  [PayoutStatus.PENDING]:    'bg-yellow-100 text-yellow-800',
  [PayoutStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
  [PayoutStatus.DELIVERED]:  'bg-green-100 text-green-800',
  [PayoutStatus.FAILED]:     'bg-red-100 text-red-800',
  [PayoutStatus.FLAGGED]:    'bg-orange-100 text-orange-800',
};
