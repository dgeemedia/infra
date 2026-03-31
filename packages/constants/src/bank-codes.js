// packages/constants/src/bank-codes.js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBankOptions = exports.getBankName = exports.isValidBankCode = exports.NIGERIAN_BANKS = void 0;
exports.NIGERIAN_BANKS = {
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
    '090175': 'Empire Trust Microfinance Bank',
    '090267': 'Kuda Bank',
    '090157': 'Petra Microfinance Bank',
    '090270': 'AB Microfinance Bank',
    '100004': 'OPay (One Finance)',
    '100033': 'PalmPay',
    '100014': 'Paga',
    '999992': 'Moniepoint Microfinance Bank',
    '999991': 'PalmPay (Alt)',
    '120001': 'Nine Payment Service Bank',
    '110005': 'TeamApt (Moniepoint)',
    '301': 'Jaiz Bank (Non-Interest)',
    '302': 'Lotus Bank',
};
const isValidBankCode = (code) => code in exports.NIGERIAN_BANKS;
exports.isValidBankCode = isValidBankCode;
const getBankName = (code) => exports.NIGERIAN_BANKS[code] ?? 'Unknown Bank';
exports.getBankName = getBankName;
const getBankOptions = () => Object.entries(exports.NIGERIAN_BANKS)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
exports.getBankOptions = getBankOptions;
//# sourceMappingURL=bank-codes.js.map