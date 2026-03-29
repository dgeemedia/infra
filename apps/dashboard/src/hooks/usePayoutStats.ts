'use client';

import { useQuery } from '@tanstack/react-query';
import { api }      from '@/lib/api';
import type { PartnerStats } from '@elorge/types';

export function usePayoutStats(partnerId: string) {
  return useQuery({
    queryKey: ['stats', partnerId],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: PartnerStats }>(
        `/v1/partners/${partnerId}/stats`,
      );
      return data.data;
    },
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000,
  });
}

// ── Volume chart data (last 30 days) ──────────────────────
export function useVolumeData(days = 30) {
  return useQuery({
    queryKey: ['volume', days],
    queryFn:  async () => {
      const endDate   = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data } = await api.get<{ success: boolean; data: { data: Array<{
        createdAt:   string;
        nairaAmount: number;
        status:      string;
      }> } }>(
        `/v1/payouts?pageSize=500&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
      );

      // Group by day
      const byDay: Record<string, { volume: number; count: number; success: number }> = {};

      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0] ?? '';
        byDay[key] = { volume: 0, count: 0, success: 0 };
      }

      for (const p of data.data.data) {
        const day = p.createdAt.split('T')[0];
        if (day && byDay[day]) {
          byDay[day].volume  += Number(p.nairaAmount);
          byDay[day].count   += 1;
          if (p.status === 'DELIVERED') byDay[day].success += 1;
        }
      }

      return Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, vals]) => ({
          date,
          volume:      Math.round(vals.volume),
          count:       vals.count,
          successRate: vals.count > 0
            ? Math.round((vals.success / vals.count) * 100)
            : 0,
        }));
    },
    staleTime: 5 * 60_000,
  });
}
