'use client';

// apps/dashboard/src/app/(dashboard)/admin/transactions/page.tsx
import { useState }             from 'react';
import { AdminGuard }           from '@/components/admin/AdminGuard';
import { useAdminTransactions } from '@/hooks/useAdmin';
import { useAdminPartners }     from '@/hooks/useAdmin';
import { StatusBadge }          from '@/components/transactions/StatusBadge';
import {
  formatNaira, formatDate, truncateId,
} from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const STATUSES = ['', 'PENDING', 'PROCESSING', 'DELIVERED', 'FAILED', 'FLAGGED'];

function TransactionsContent() {
  const [page,      setPage]      = useState(1);
  const [status,    setStatus]    = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [search,    setSearch]    = useState('');

  const { data: partners } = useAdminPartners();

  const { data, isLoading } = useAdminTransactions({
    page,
    pageSize: 20,
    status:    status    || undefined,
    partnerId: partnerId || undefined,
  });

  const payouts = data?.data ?? [];

  // Client-side reference search (API-side search can be added later)
  const filtered = search.trim()
    ? payouts.filter((p) =>
        p.partnerReference.toLowerCase().includes(search.toLowerCase()),
      )
    : payouts;

  function resetFilters() {
    setStatus('');
    setPartnerId('');
    setSearch('');
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every payout across all partners
        </p>
      </div>

      {/* ── Filters ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Reference search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Partner filter */}
        <select
          value={partnerId}
          onChange={(e) => { setPartnerId(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All partners</option>
          {(partners ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>

        {/* Clear filters */}
        {(status || partnerId || search) && (
          <button
            onClick={resetFilters}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Reference', 'Partner', 'Recipient', 'Status', 'Amount', 'Created', 'Delivered'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && filtered.map((payout) => (
                <tr key={payout.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs">
                    {truncateId(payout.partnerReference)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground">{payout.partner.name}</p>
                    <p className="text-[10px] text-muted-foreground">{payout.partner.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-foreground">{payout.recipient?.fullName ?? '—'}</p>
                    <p className="text-[10px] text-muted-foreground">{payout.recipient?.bankName ?? ''}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={payout.status} />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground text-xs">
                    {formatNaira(payout.nairaAmountKobo / 100)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(payout.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {payout.deliveredAt ? formatDate(payout.deliveredAt) : '—'}
                  </td>
                </tr>
              ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              {data.total} total transactions
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

export default function AdminTransactionsPage() {
  return (
    <AdminGuard>
      <TransactionsContent />
    </AdminGuard>
  );
}