// apps/dashboard/src/hooks/useTransactions.ts
'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PayoutListResponse, PayoutStatusResponse } from '@elorge/types';

interface TransactionFilters {
  page?:      number;
  pageSize?:  number;
  status?:    string;
  startDate?: string;
  endDate?:   string;
  search?:    string;
}

// ── List transactions ──────────────────────────────────────
export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn:  async () => {
      const params = new URLSearchParams();
      if (filters.page)      params.set('page',      String(filters.page));
      if (filters.pageSize)  params.set('pageSize',  String(filters.pageSize));
      if (filters.status)    params.set('status',    filters.status);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate)   params.set('endDate',   filters.endDate);
      if (filters.search)    params.set('search',    filters.search);

      const { data } = await api.get<{ success: boolean; data: PayoutListResponse }>(
        `/v1/payouts?${params.toString()}`,
      );
      return data.data;
    },
    staleTime: 30_000,
  });
}

// ── Single transaction status ──────────────────────────────
export function useTransactionStatus(payoutId: string) {
  return useQuery({
    queryKey: ['transaction', payoutId],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: PayoutStatusResponse }>(
        `/v1/payouts/${payoutId}`,
      );
      return data.data;
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING' || status === 'PROCESSING' ? 5_000 : false;
    },
  });
}

// ── Export transactions as CSV ─────────────────────────────
export function useExportTransactions() {
  return useMutation({
    mutationFn: async (filters: TransactionFilters) => {
      const params = new URLSearchParams();
      params.set('pageSize', '1000');
      if (filters.status)    params.set('status',    filters.status);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate)   params.set('endDate',   filters.endDate);

      const { data } = await api.get<{ success: boolean; data: PayoutListResponse }>(
        `/v1/payouts?${params.toString()}`,
      );

      const rows = data.data.data;
      const headers = [
        'ID',
        'Reference',
        'Status',
        'Naira Amount (NGN)',
        'Fee (NGN)',
        'Exchange Rate',
        'Recipient',
        'Bank',
        'Created At',
        'Delivered At',
      ];
      const csvRows = rows.map((p) => [
        p.id,
        p.partnerReference,
        p.status,
        (p.nairaAmountKobo / 100).toFixed(2),
        (p.feeKobo / 100).toFixed(2),
        p.exchangeRateAudit !== null && p.exchangeRateAudit !== undefined
          ? String(p.exchangeRateAudit)
          : '',
        p.recipient?.fullName ?? '',
        p.recipient?.bankName ?? '',
        p.createdAt,
        p.deliveredAt ?? '',
      ]);

      const csv = [headers, ...csvRows]
        .map((row) => row.map((v) => `"${String(v)}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `elorge-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}