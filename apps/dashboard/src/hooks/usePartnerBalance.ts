// apps/dashboard/src/hooks/usePartnerBalance.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { api }      from '@/lib/api';

export interface LedgerEntry {
  id:                string;
  type:              'CREDIT' | 'DEBIT' | 'REFUND';
  amountKobo:        number;
  amountNaira:       string;
  balanceAfterKobo:  number;
  balanceAfterNaira: string;
  description:       string;
  createdAt:         string;
}

export interface FundingAccount {
  bankName:      string;
  bankCode:      string;
  accountNumber: string;
  accountName:   string;
  reference:     string;
  instructions:  string[];
}

export interface PartnerBalance {
  balanceKobo:    number;
  balanceNaira:   string;
  country:        string;
  fundingAccount: FundingAccount | null;
  recentLedger:   LedgerEntry[];
}

export function usePartnerBalance() {
  return useQuery({
    queryKey: ['partner', 'balance'],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: PartnerBalance }>(
        '/v1/me/balance',
      );
      // Handle both wrapped and unwrapped responses
      return (data as unknown as { data: PartnerBalance }).data ?? (data as unknown as PartnerBalance);
    },
    staleTime:       60_000,
    refetchInterval: 60_000,
  });
}