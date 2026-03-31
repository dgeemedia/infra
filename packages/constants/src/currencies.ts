// packages/constants/src/currencies.ts
export enum Currency {
  GBP = 'GBP', // British Pound Sterling — primary (FinestPay UK)
  USD = 'USD', // US Dollar
  EUR = 'EUR', // Euro
  CAD = 'CAD', // Canadian Dollar
  NGN = 'NGN', // Nigerian Naira — always the payout currency
}

// Currencies partners can send FROM (not NGN)
export const SENDING_CURRENCIES: Currency[] = [
  Currency.GBP,
  Currency.USD,
  Currency.EUR,
  Currency.CAD,
];

// Human-readable labels
export const CURRENCY_LABELS: Record<Currency, string> = {
  [Currency.GBP]: 'British Pound (£)',
  [Currency.USD]: 'US Dollar ($)',
  [Currency.EUR]: 'Euro (€)',
  [Currency.CAD]: 'Canadian Dollar (CA$)',
  [Currency.NGN]: 'Nigerian Naira (₦)',
};

// Currency symbols
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  [Currency.GBP]: '£',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.CAD]: 'CA$',
  [Currency.NGN]: '₦',
};

// Decimal places per currency
export const CURRENCY_DECIMALS: Record<Currency, number> = {
  [Currency.GBP]: 2,
  [Currency.USD]: 2,
  [Currency.EUR]: 2,
  [Currency.CAD]: 2,
  [Currency.NGN]: 2,
};

// Helper: format an amount with its currency symbol
export const formatCurrency = (amount: number, currency: Currency): string => {
  const symbol = CURRENCY_SYMBOLS[currency];
  const decimals = CURRENCY_DECIMALS[currency];
  return `${symbol}${amount.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};
