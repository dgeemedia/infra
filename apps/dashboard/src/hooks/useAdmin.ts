// apps/dashboard/src/hooks/useAdmin.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Platform stats ────────────────────────────────────────────
export function useAdminStats() {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: {
        totalPartners:      number;
        activePartners:     number;
        totalPayouts:       number;
        deliveredPayouts:   number;
        failedPayouts:      number;
        flaggedPayouts:     number;
        successRate:        number;
        totalVolumeNaira:   number;
        totalFeesCollected: number;
      } }>('/v1/admin/stats');
      return data.data;
    },
    staleTime: 60_000,
  });
}

// ── All partners ──────────────────────────────────────────────
export function useAdminPartners() {
  return useQuery({
    queryKey: ['admin', 'partners'],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: Array<{
        id:              string;
        name:            string;
        email:           string;
        country:         string;
        status:          string;
        createdAt:       string;
        activeApiKeys:   number;
        totalPayouts:    number;
        activeWebhooks:  number;
        deliveredVolume: number;
        deliveredCount:  number;
      }> }>('/v1/admin/partners');
      return data.data;
    },
    staleTime: 30_000,
  });
}

// ── Suspend partner ───────────────────────────────────────────
export function useSuspendPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/admin/partners/${id}/suspend`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
    },
  });
}

// ── Activate partner ──────────────────────────────────────────
export function useActivatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/admin/partners/${id}/activate`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
    },
  });
}

// ── All transactions ──────────────────────────────────────────
export function useAdminTransactions(filters: {
  page?:      number;
  pageSize?:  number;
  status?:    string;
  partnerId?: string;
  startDate?: string;
  endDate?:   string;
} = {}) {
  return useQuery({
    queryKey: ['admin', 'transactions', filters],
    queryFn:  async () => {
      const params = new URLSearchParams();
      if (filters.page)      params.set('page',      String(filters.page));
      if (filters.pageSize)  params.set('pageSize',  String(filters.pageSize));
      if (filters.status)    params.set('status',    filters.status);
      if (filters.partnerId) params.set('partnerId', filters.partnerId);
      if (filters.startDate) params.set('startDate', filters.startDate);
      if (filters.endDate)   params.set('endDate',   filters.endDate);

      const { data } = await api.get<{ success: boolean; data: {
        data:       unknown[];
        total:      number;
        page:       number;
        pageSize:   number;
        totalPages: number;
      } }>(`/v1/admin/transactions?${params.toString()}`);
      return data.data;
    },
    staleTime: 30_000,
  });
}

// ── Flagged payouts ───────────────────────────────────────────
export function useFlaggedPayouts() {
  return useQuery({
    queryKey: ['admin', 'flagged'],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: unknown[] }>(
        '/v1/admin/flagged',
      );
      return data.data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

// ── Release flagged payout ────────────────────────────────────
export function useReleasePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/admin/flagged/${id}/release`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flagged'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

// ── Reject flagged payout ─────────────────────────────────────
export function useRejectPayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/admin/flagged/${id}/reject`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'flagged'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}
