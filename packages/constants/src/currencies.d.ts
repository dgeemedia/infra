export declare enum Currency {
    GBP = "GBP",
    USD = "USD",
    EUR = "EUR",
    CAD = "CAD",
    NGN = "NGN"
}
export declare const SENDING_CURRENCIES: Currency[];
export declare const CURRENCY_LABELS: Record<Currency, string>;
export declare const CURRENCY_SYMBOLS: Record<Currency, string>;
export declare const CURRENCY_DECIMALS: Record<Currency, number>;
export declare const formatCurrency: (amount: number, currency: Currency) => string;
//# sourceMappingURL=currencies.d.ts.map