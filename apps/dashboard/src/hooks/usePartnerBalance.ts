// apps/dashboard/src/hooks/usePartnerBalance.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { api }      from '@/lib/api';

export interface LedgerEntry {
  id:               string;
  type:             'CREDIT' | 'DEBIT' | 'REFUND';
  amountKobo:       number;
  amountNaira:      string;
  balanceAfterKobo: number;
  balanceAfterNaira:string;
  description:      string;
  createdAt:        string;
}

export interface PartnerBalance {
  balanceKobo:  number;
  balanceNaira: string;
  country:      string;
  recentLedger: LedgerEntry[];
}

export function usePartnerBalance() {
  return useQuery({
    queryKey: ['partner', 'balance'],
    queryFn:  async () => {
      const { data } = await api.get<PartnerBalance>('/v1/me/balance');
      return data;
    },
    staleTime:       60_000,
    refetchInterval: 60_000,
  });
}