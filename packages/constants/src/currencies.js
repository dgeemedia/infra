"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCurrency = exports.CURRENCY_DECIMALS = exports.CURRENCY_SYMBOLS = exports.CURRENCY_LABELS = exports.SENDING_CURRENCIES = exports.Currency = void 0;
var Currency;
(function (Currency) {
    Currency["GBP"] = "GBP";
    Currency["USD"] = "USD";
    Currency["EUR"] = "EUR";
    Currency["CAD"] = "CAD";
    Currency["NGN"] = "NGN";
})(Currency || (exports.Currency = Currency = {}));
exports.SENDING_CURRENCIES = [
    Currency.GBP,
    Currency.USD,
    Currency.EUR,
    Currency.CAD,
];
exports.CURRENCY_LABELS = {
    [Currency.GBP]: 'British Pound (£)',
    [Currency.USD]: 'US Dollar ($)',
    [Currency.EUR]: 'Euro (€)',
    [Currency.CAD]: 'Canadian Dollar (CA$)',
    [Currency.NGN]: 'Nigerian Naira (₦)',
};
exports.CURRENCY_SYMBOLS = {
    [Currency.GBP]: '£',
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.CAD]: 'CA$',
    [Currency.NGN]: '₦',
};
exports.CURRENCY_DECIMALS = {
    [Currency.GBP]: 2,
    [Currency.USD]: 2,
    [Currency.EUR]: 2,
    [Currency.CAD]: 2,
    [Currency.NGN]: 2,
};
const formatCurrency = (amount, currency) => {
    const symbol = exports.CURRENCY_SYMBOLS[currency];
    const decimals = exports.CURRENCY_DECIMALS[currency];
    return `${symbol}${amount.toLocaleString('en-GB', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })}`;
};
exports.formatCurrency = formatCurrency;
//# sourceMappingURL=currencies.js.map