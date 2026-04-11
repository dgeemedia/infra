'use client';

// apps/dashboard/src/app/(dashboard)/admin/sessions/page.tsx
import { useState }   from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useQuery }   from '@tanstack/react-query';
import { api }        from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Monitor, Search, MapPin, Users } from 'lucide-react';
import { useAdminPartners } from '@/hooks/useAdmin';

interface LoginSession {
  id:         string;
  ipAddress:  string;
  userAgent:  string | null;
  city:       string | null;
  country:    string | null;
  loggedInAt: string;
  partner:    { id: string; name: string; email: string };
}

interface SessionsResponse {
  sessions:   LoginSession[];
  total:      number;
  totalPages: number;
}

function SessionsContent() {
  const [page,          setPage]          = useState(1);
  const [ipFilter,      setIpFilter]      = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');

  const { data: partners } = useAdminPartners();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'login-sessions', page, ipFilter, partnerFilter],
    queryFn:  async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '50' });
      if (ipFilter.trim()) params.set('ipAddress', ipFilter.trim());
      if (partnerFilter)   params.set('partnerId', partnerFilter);
      const res = await api.get<{ success: boolean; data: SessionsResponse; timestamp: string }>(
        `/v1/admin/login-sessions?${params.toString()}`,
      );
      return res.data.data;
    },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Login Sessions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every dashboard login across all partners — IPs, locations, and devices.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">

        {/* Partner filter */}
        <div className="flex items-center gap-1.5">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={partnerFilter}
            onChange={(e) => { setPartnerFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All partners</option>
            {(partners ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* IP filter */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by IP address…"
            value={ipFilter}
            onChange={(e) => { setIpFilter(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Clear filters */}
        {(ipFilter || partnerFilter) && (
          <button
            onClick={() => { setIpFilter(''); setPartnerFilter(''); setPage(1); }}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Summary */}
      {data && (
        <p className="text-xs text-muted-foreground">
          {data.total} total session{data.total !== 1 ? 's' : ''}
          {partnerFilter && partners && (
            <> for <span className="font-medium text-foreground">
              {partners.find((p) => p.id === partnerFilter)?.name ?? 'selected partner'}
            </span></>
          )}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Partner', 'IP Address', 'Location', 'Device', 'Logged In At'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && (data?.sessions ?? []).map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-foreground">{s.partner.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.partner.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-foreground">{s.ipAddress}</code>
                  </td>
                  <td className="px-4 py-3">
                    {(s.city ?? s.country) ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {[s.city, s.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <div className="flex items-start gap-1.5">
                      <Monitor className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        {s.userAgent ?? '—'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(s.loggedInAt)}
                  </td>
                </tr>
              ))}

              {!isLoading && (data?.sessions ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No sessions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page} of {data.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-3 py-1.5 text-xs border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="rounded-lg px-3 py-1.5 text-xs border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginSessionsPage() {
  return <AdminGuard><SessionsContent /></AdminGuard>;
}