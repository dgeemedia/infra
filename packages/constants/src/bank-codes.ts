// All CBN-registered Nigerian bank codes (NIBSS NIP codes)
// Used for validating recipient bank details on every payout

export const NIGERIAN_BANKS: Record<string, string> = {
  // ── Commercial Banks ──────────────────────────────────
  '044': 'Access Bank',
  '063': 'Access Bank (Diamond)',
  '035A': 'ALAT by Wema',
  '401': 'ASO Savings and Loans',
  '023': 'Citibank Nigeria',
  '050': 'Ecobank Nigeria',
  '562': 'Ekondo Microfinance Bank',
  '070': 'Fidelity Bank',
  '214': 'First City Monument Bank (FCMB)',
  '011': 'First Bank of Nigeria',
  '608': 'FINATRUST Microfinance Bank',
  '501': 'Jaiz Bank',
  '082': 'Keystone Bank',
  '526': 'Parallex Bank',
  '076': 'Polaris Bank',
  '101': 'Providus Bank',
  '221': 'Stanbic IBTC Bank',
  '068': 'Standard Chartered Bank',
  '232': 'Sterling Bank',
  '100': 'Suntrust Bank',
  '032': 'Union Bank of Nigeria',
  '033': 'United Bank for Africa (UBA)',
  '215': 'Unity Bank',
  '035': 'Wema Bank',
  '057': 'Zenith Bank',
  '058': 'Guaranty Trust Bank (GTBank)',

  // ── Microfinance Banks ────────────────────────────────
  '090175': 'Empire Trust Microfinance Bank',
  '090267': 'Kuda Bank',
  '090157': 'Petra Microfinance Bank',
  '090270': 'AB Microfinance Bank',

  // ── Mobile Money / Fintech ────────────────────────────
  '100004': 'OPay (One Finance)',
  '100033': 'PalmPay',
  '100014': 'Paga',
  '999992': 'Moniepoint Microfinance Bank',
  '999991': 'PalmPay (Alt)',
  '120001': 'Nine Payment Service Bank',
  '110005': 'TeamApt (Moniepoint)',

  // ── Non-Interest Banks ────────────────────────────────
  '301': 'Jaiz Bank (Non-Interest)',
  '302': 'Lotus Bank',
} as const;

// Type for valid bank codes
export type NigerianBankCode = keyof typeof NIGERIAN_BANKS;

// Helper: check if a bank code is valid
export const isValidBankCode = (code: string): code is NigerianBankCode =>
  code in NIGERIAN_BANKS;

// Helper: get bank name from code
export const getBankName = (code: string): string =>
  NIGERIAN_BANKS[code] ?? 'Unknown Bank';

// Helper: get all bank options for dropdowns
export const getBankOptions = (): Array<{ code: string; name: string }> =>
  Object.entries(NIGERIAN_BANKS)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
