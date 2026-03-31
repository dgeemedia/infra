// apps/dashboard/src/hooks/useTransactions.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    staleTime: 30_000, // 30 seconds
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
      // Poll every 5s while pending/processing
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

      // Convert to CSV
      const rows  = data.data.data;
      const headers = ['ID', 'Reference', 'Status', 'Amount (GBP)', 'Naira Amount', 'Recipient', 'Bank', 'Created At', 'Delivered At'];
      const csvRows = rows.map((p) => [
        p.payoutId,
        p.partnerReference,
        p.status,
        p.fee ? (Number(p.nairaAmount) / Number(p.exchangeRate)).toFixed(2) : '',
        p.nairaAmount,
        '',
        '',
        p.createdAt,
        p.deliveredAt ?? '',
      ]);

      const csv = [headers, ...csvRows]
        .map((row) => row.map((v) => `"${String(v)}"`).join(','))
        .join('\n');

      // Trigger download
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
