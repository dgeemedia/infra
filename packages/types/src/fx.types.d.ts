import type { Currency } from '@elorge/constants';
export interface FxQuote {
    fromCurrency: Currency;
    toCurrency: Currency;
    sendAmount: number;
    exchangeRate: number;
    fee: number;
    recipientGets: number;
    rateExpiresAt: string;
}
export interface RateResponse {
    quote: FxQuote;
    indicativeOnly: boolean;
}
export interface RawExchangeRate {
    base: string;
    rates: Record<string, number>;
    timestamp: number;
}
//# sourceMappingURL=fx.types.d.ts.map