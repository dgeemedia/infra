// packages/constants/src/bank-codes.d.ts
export declare const NIGERIAN_BANKS: Record<string, string>;
export type NigerianBankCode = keyof typeof NIGERIAN_BANKS;
export declare const isValidBankCode: (code: string) => code is NigerianBankCode;
export declare const getBankName: (code: string) => string;
export declare const getBankOptions: () => Array<{
    code: string;
    name: string;
}>;
//# sourceMappingURL=bank-codes.d.ts.map