// apps/dashboard/src/components/transactions/TransactionTable.tsx
'use client';

import { useState }        from 'react';
import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal } from 'lucide-react';

import { useTransactions, useExportTransactions } from '@/hooks/useTransactions';
import { useDashboardStore }                      from '@/store/dashboard.store';
import { StatusBadge }                            from './StatusBadge';
import {
  formatNaira, formatGbp, formatDate,
  truncateId, cn,
}                                                 from '@/lib/utils';

const STATUSES = ['', 'PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'FLAGGED'];

export function TransactionTable() {
  const [page, setPage]           = useState(1);
  const { statusFilter, setStatusFilter, searchQuery, setSearchQuery, dateRange } =
    useDashboardStore();

  const { data, isLoading, isError } = useTransactions({
    page,
    pageSize:  20,
    status:    statusFilter || undefined,
    search:    searchQuery  || undefined,
    startDate: dateRange.startDate,
    endDate:   dateRange.endDate,
  });

  const exportMutation = useExportTransactions();

  return (
    <div className="space-y-4">

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reference or recipient..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s || 'All statuses'}</option>
              ))}
            </select>
          </div>

          {/* Export */}
          <button
            onClick={() => exportMutation.mutate({ status: statusFilter || undefined, startDate: dateRange.startDate, endDate: dateRange.endDate })}
            disabled={exportMutation.isPending}
            className="flex items-center gap-1.5 rounded-lg border border-input bg-background px-3 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Reference', 'Status', 'Amount', 'Naira', 'Recipient', 'Created', 'Delivered'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-muted animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              )}

              {isError && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-destructive">
                    Failed to load transactions. Please refresh.
                  </td>
                </tr>
              )}

              {!isLoading && !isError && data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              )}

              {!isLoading && data?.data.map((payout) => (
                <tr key={payout.payoutId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs text-foreground">{truncateId(payout.partnerReference)}</div>
                    <div className="font-mono text-[10px] text-muted-foreground mt-0.5">{truncateId(payout.payoutId)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={payout.status} />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {formatGbp(Number(payout.fee) + (Number(payout.nairaAmount) / Number(payout.exchangeRate)))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatNaira(Number(payout.nairaAmount))}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {payout.partnerReference}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatDate(payout.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {payout.deliveredAt ? formatDate(payout.deliveredAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ───────────────────────────────── */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-sm">{page} / {data.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="rounded-lg p-1.5 hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
