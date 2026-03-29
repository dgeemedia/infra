// Elorge Platform Error Code Registry
// Every error the API can return has a unique code.
// This makes it easy for partners to handle errors programmatically.
// Format: ELG_XXX where XXX is a 3-digit number grouped by category.

export const ERROR_CODES = {
  // ── Authentication (001–019) ───────────────────────────
  INVALID_API_KEY:         'ELG_001', // API key not found or revoked
  EXPIRED_API_KEY:         'ELG_002', // API key has been rotated/expired
  MISSING_API_KEY:         'ELG_003', // Authorization header not provided
  INVALID_JWT:             'ELG_004', // JWT token invalid or expired
  INSUFFICIENT_PERMISSION: 'ELG_005', // action not allowed for this partner

  // ── Validation (020–039) ──────────────────────────────
  INVALID_BANK_CODE:       'ELG_020', // bank code not in CBN registry
  INVALID_ACCOUNT_NUMBER:  'ELG_021', // account number not 10 digits (NUBAN)
  INVALID_CURRENCY:        'ELG_022', // currency not supported
  AMOUNT_TOO_LOW:          'ELG_023', // below minimum transfer amount
  AMOUNT_TOO_HIGH:         'ELG_024', // above maximum transfer amount
  DUPLICATE_REFERENCE:     'ELG_025', // partnerReference already used
  INVALID_PHONE_NUMBER:    'ELG_026', // phone number format invalid
  MISSING_REQUIRED_FIELD:  'ELG_027', // required field not provided
  INVALID_REQUEST_BODY:    'ELG_028', // malformed JSON or wrong types

  // ── Compliance (040–059) ──────────────────────────────
  SANCTIONS_HIT:           'ELG_040', // recipient matched sanctions list
  COMPLIANCE_CHECK_FAILED: 'ELG_041', // compliance service unavailable
  KYC_REQUIRED:            'ELG_042', // partner must complete KYC first
  TRANSACTION_FLAGGED:     'ELG_043', // manual review required

  // ── FX / Rates (060–079) ──────────────────────────────
  RATE_UNAVAILABLE:        'ELG_060', // FX rate provider unreachable
  RATE_EXPIRED:            'ELG_061', // quoted rate has expired

  // ── PSP / Bank Transfer (080–099) ─────────────────────
  PSP_UNAVAILABLE:         'ELG_080', // PSP API is down
  BANK_ACCOUNT_NOT_FOUND:  'ELG_081', // account number not found at bank
  BANK_ACCOUNT_RESTRICTED: 'ELG_082', // recipient account frozen/restricted
  INSUFFICIENT_PSP_FUNDS:  'ELG_083', // Elorge's PSP wallet needs topping up
  TRANSFER_REJECTED:       'ELG_084', // bank rejected the transfer
  TRANSFER_TIMEOUT:        'ELG_085', // no response from bank within SLA

  // ── Payout (100–119) ──────────────────────────────────
  PAYOUT_NOT_FOUND:        'ELG_100', // payoutId does not exist
  PAYOUT_ALREADY_TERMINAL: 'ELG_101', // cannot update a delivered/flagged payout
  PAYOUT_NOT_RETRYABLE:    'ELG_102', // status does not allow retry

  // ── Webhook (120–139) ─────────────────────────────────
  WEBHOOK_URL_INVALID:     'ELG_120', // URL not reachable or invalid format
  WEBHOOK_NOT_FOUND:       'ELG_121', // webhookId does not exist
  WEBHOOK_LIMIT_REACHED:   'ELG_122', // partner already has max webhooks

  // ── Partner (140–159) ─────────────────────────────────
  PARTNER_NOT_FOUND:       'ELG_140',
  PARTNER_SUSPENDED:       'ELG_141', // partner account is suspended
  PARTNER_ALREADY_EXISTS:  'ELG_142',

  // ── System (900–999) ──────────────────────────────────
  INTERNAL_SERVER_ERROR:   'ELG_900',
  SERVICE_UNAVAILABLE:     'ELG_901',
  RATE_LIMIT_EXCEEDED:     'ELG_902', // too many requests from this API key
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// Human-readable messages for each error code
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.INVALID_API_KEY]:         'The provided API key is invalid or has been revoked.',
  [ERROR_CODES.EXPIRED_API_KEY]:         'The API key has expired. Please generate a new one.',
  [ERROR_CODES.MISSING_API_KEY]:         'Authorization header is required.',
  [ERROR_CODES.INVALID_JWT]:             'Session token is invalid or has expired.',
  [ERROR_CODES.INSUFFICIENT_PERMISSION]: 'You do not have permission to perform this action.',
  [ERROR_CODES.INVALID_BANK_CODE]:       'The bank code provided is not a valid CBN-registered bank.',
  [ERROR_CODES.INVALID_ACCOUNT_NUMBER]:  'Account number must be exactly 10 digits (NUBAN format).',
  [ERROR_CODES.INVALID_CURRENCY]:        'Currency not supported. Supported: GBP, USD, EUR, CAD.',
  [ERROR_CODES.AMOUNT_TOO_LOW]:          'Transfer amount is below the minimum allowed.',
  [ERROR_CODES.AMOUNT_TOO_HIGH]:         'Transfer amount exceeds the maximum allowed.',
  [ERROR_CODES.DUPLICATE_REFERENCE]:     'A payout with this partnerReference already exists.',
  [ERROR_CODES.INVALID_PHONE_NUMBER]:    'Phone number must be a valid Nigerian mobile number.',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]:  'One or more required fields are missing.',
  [ERROR_CODES.INVALID_REQUEST_BODY]:    'Request body is malformed or contains invalid types.',
  [ERROR_CODES.SANCTIONS_HIT]:           'Recipient matched a sanctions screening list. Payout flagged.',
  [ERROR_CODES.COMPLIANCE_CHECK_FAILED]: 'Compliance check could not be completed. Please retry.',
  [ERROR_CODES.KYC_REQUIRED]:            'Partner KYC verification is required before processing payouts.',
  [ERROR_CODES.TRANSACTION_FLAGGED]:     'Transaction has been flagged for manual review.',
  [ERROR_CODES.RATE_UNAVAILABLE]:        'Exchange rate is temporarily unavailable. Please retry.',
  [ERROR_CODES.RATE_EXPIRED]:            'The quoted exchange rate has expired. Fetch a new rate.',
  [ERROR_CODES.PSP_UNAVAILABLE]:         'Payment processing is temporarily unavailable. Please retry.',
  [ERROR_CODES.BANK_ACCOUNT_NOT_FOUND]:  'Recipient account number was not found at the specified bank.',
  [ERROR_CODES.BANK_ACCOUNT_RESTRICTED]: 'Recipient account is restricted and cannot receive funds.',
  [ERROR_CODES.INSUFFICIENT_PSP_FUNDS]:  'Platform wallet requires topping up. Contact support.',
  [ERROR_CODES.TRANSFER_REJECTED]:       'Bank rejected the transfer. Check recipient account details.',
  [ERROR_CODES.TRANSFER_TIMEOUT]:        'Bank transfer timed out. Check status before retrying.',
  [ERROR_CODES.PAYOUT_NOT_FOUND]:        'No payout found with the provided ID.',
  [ERROR_CODES.PAYOUT_ALREADY_TERMINAL]: 'Payout is in a terminal state and cannot be modified.',
  [ERROR_CODES.PAYOUT_NOT_RETRYABLE]:    'Payout status does not allow retry.',
  [ERROR_CODES.WEBHOOK_URL_INVALID]:     'Webhook URL is not reachable or has an invalid format.',
  [ERROR_CODES.WEBHOOK_NOT_FOUND]:       'No webhook found with the provided ID.',
  [ERROR_CODES.WEBHOOK_LIMIT_REACHED]:   'Maximum number of webhooks per partner reached.',
  [ERROR_CODES.PARTNER_NOT_FOUND]:       'No partner found with the provided ID.',
  [ERROR_CODES.PARTNER_SUSPENDED]:       'Partner account is suspended. Contact support.',
  [ERROR_CODES.PARTNER_ALREADY_EXISTS]:  'A partner with this email already exists.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]:   'An unexpected error occurred. Please retry or contact support.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]:     'Service is temporarily unavailable. Please retry shortly.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]:     'Too many requests. Please slow down and retry.',
};
