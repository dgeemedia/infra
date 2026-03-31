// apps/dashboard/src/app/(dashboard)/transactions/page.tsx
'use client';

import { useState }          from 'react';
import { Calendar }          from 'lucide-react';
import { TransactionTable }  from '@/components/transactions/TransactionTable';
import { useDashboardStore } from '@/store/dashboard.store';

export default function TransactionsPage() {
  const { dateRange, setDateRange, resetFilters } = useDashboardStore();

  return (
    <div className="space-y-5">

      {/* ── Header ────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            All payout records — search, filter and export
          </p>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={resetFilters}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────── */}
      <TransactionTable />
    </div>
  );
}
