'use client';

// apps/dashboard/src/hooks/usePartnerBalance.ts
import { useQuery } from '@tanstack/react-query';
import { api }      from '@/lib/api';

interface LedgerEntry {
  id:              string;
  type:            'CREDIT' | 'DEBIT' | 'REFUND';
  amountGbp:       string;
  balanceAfterGbp: string;
  description:     string;
  createdAt:       string;
}

interface PartnerBalance {
  balancePence:  number;
  balanceGbp:    string;
  country:       string;
  recentLedger:  LedgerEntry[];
}

export function usePartnerBalance() {
  return useQuery({
    queryKey: ['partner', 'balance'],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: PartnerBalance }>(
        '/v1/me/balance',
      );
      return data.data;
    },
    staleTime:       60_000,
    refetchInterval: 60_000,
  });
}