// apps/api/src/modules/psp/psp.interface.ts
export interface PspTransferRequest {
  reference:     string;   // Elorge payout ID — used as idempotency key
  amount:        number;   // Naira amount (NGN)
  bankCode:      string;   // CBN bank code e.g. "058"
  accountNumber: string;   // 10-digit NUBAN
  accountName:   string;   // recipient full name
  narration:     string;   // appears on bank statement
}

export interface PspTransferResponse {
  success:      boolean;
  pspReference: string;         // PSP's own transaction ID
  status:       PspStatus;
  message?:     string;
  bankSession?: string;         // NIBSS NIP session ID (returned by bank)
}

export type PspStatus =
  | 'successful'
  | 'pending'
  | 'failed'
  | 'reversed';

export interface PspBalanceResponse {
  available: number;            // available NGN balance in wallet
  ledger:    number;            // total ledger balance
  currency:  string;
}

export interface IPspAdapter {
  /**
   * Execute a Naira bank transfer.
   * Must be idempotent — same reference = same result.
   */
  transfer(request: PspTransferRequest): Promise<PspTransferResponse>;

  /**
   * Check the status of a previously initiated transfer.
   */
  checkStatus(pspReference: string): Promise<PspTransferResponse>;

  /**
   * Get current wallet balance — used for monitoring.
   */
  getBalance(): Promise<PspBalanceResponse>;

  /**
   * Validate that an account number exists at the given bank.
   * Calls NIBSS Name Enquiry (NIP) via the PSP.
   */
  validateAccount(
    bankCode:      string,
    accountNumber: string,
  ): Promise<{ valid: boolean; accountName: string }>;
}
