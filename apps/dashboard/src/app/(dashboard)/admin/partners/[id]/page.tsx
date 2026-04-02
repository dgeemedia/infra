'use client';

// apps/dashboard/src/app/(dashboard)/admin/partners/[id]/page.tsx
import { useParams }   from 'next/navigation';
import { useQuery }    from '@tanstack/react-query';
import { AdminGuard }  from '@/components/admin/AdminGuard';
import { StatusBadge } from '@/components/transactions/StatusBadge';
import { api }         from '@/lib/api';
import {
  formatNaira, formatDate, formatNumber, maskApiKey, cn,
} from '@/lib/utils';
import {
  ArrowLeft, Key, Webhook, ArrowRightLeft,
  CheckCircle2, XCircle, Clock, Loader2,
} from 'lucide-react';

interface PartnerDetail {
  id:           string;
  name:         string;
  email:        string;
  country:      string;
  status:       string;
  createdAt:    string;
  apiKeys: Array<{
    id:          string;
    label:       string;
    keyPreview:  string;
    environment: string;
    createdAt:   string;
    lastUsedAt:  string | null;
  }>;
  webhooks: Array<{
    id:        string;
    url:       string;
    events:    string[];
    isActive:  boolean;
    createdAt: string;
  }>;
  payoutStats: Array<{ status: string; _count: { id: number } }>;
  recentPayouts: Array<{
    id:               string;
    partnerReference: string;
    status:           string;
    nairaAmount:      string;
    createdAt:        string;
    deliveredAt:      string | null;
    recipient:        { fullName: string; bankName: string };
  }>;
}

function PartnerDetailContent() {
  const { id } = useParams<{ id: string }>();

  const { data: partner, isLoading } = useQuery({
    queryKey: ['admin', 'partner', id],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: PartnerDetail }>(
        `/v1/admin/partners/${id}`,
      );
      return data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        Partner not found.
      </div>
    );
  }

  // Build stat map from payoutStats array
  const statMap: Record<string, number> = {};
  for (const s of partner.payoutStats) {
    statMap[s.status] = s._count.id;
  }
  const total     = Object.values(statMap).reduce((a, b) => a + b, 0);
  const delivered = statMap['DELIVERED'] ?? 0;
  const failed    = statMap['FAILED']    ?? 0;
  const flagged   = statMap['FLAGGED']   ?? 0;
  const pending   = (statMap['PENDING'] ?? 0) + (statMap['PROCESSING'] ?? 0);

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Back */}
      <a
        href="/admin/partners"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        All Partners
      </a>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{partner.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{partner.email}</p>
        </div>
        <span className={cn(
          'rounded-full px-3 py-1 text-sm font-medium',
          partner.status === 'ACTIVE'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700',
        )}>
          {partner.status}
        </span>
      </div>

      {/* Payout stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total',      value: total,     icon: ArrowRightLeft, color: 'blue'  },
          { label: 'Delivered',  value: delivered,  icon: CheckCircle2,  color: 'green' },
          { label: 'Failed',     value: failed,     icon: XCircle,       color: 'red'   },
          { label: 'Pending',    value: pending,    icon: Clock,         color: 'amber' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className={cn(
              'rounded-lg border p-2 w-fit mb-3',
              color === 'blue'  ? 'bg-blue-50  text-blue-600  border-blue-100'  :
              color === 'green' ? 'bg-green-50 text-green-600 border-green-100' :
              color === 'red'   ? 'bg-red-50   text-red-600   border-red-100'   :
                                  'bg-amber-50 text-amber-600 border-amber-100',
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-xl font-bold text-foreground">{formatNumber(value)}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
        <h2 className="text-sm font-semibold text-foreground mb-3">Partner Info</h2>
        {[
          { label: 'Partner ID', value: partner.id },
          { label: 'Country',    value: partner.country },
          { label: 'Joined',     value: formatDate(partner.createdAt) },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-2.5">
            <span className="text-sm text-muted-foreground">{label}</span>
            <code className="text-sm font-mono text-foreground">{value}</code>
          </div>
        ))}
      </div>

      {/* API Keys */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 bg-muted/20 flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Active API Keys ({partner.apiKeys.length})
          </h2>
        </div>
        {partner.apiKeys.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No active keys</p>
        ) : (
          <div className="divide-y divide-border">
            {partner.apiKeys.map((key) => (
              <div key={key.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{key.label}</p>
                  <code className="text-xs font-mono text-muted-foreground">
                    {maskApiKey(key.keyPreview)}
                  </code>
                </div>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-medium',
                  key.environment === 'live'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700',
                )}>
                  {key.environment}
                </span>
                <span className="text-xs text-muted-foreground">
                  {key.lastUsedAt ? `Last used ${formatDate(key.lastUsedAt)}` : 'Never used'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Webhooks */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 bg-muted/20 flex items-center gap-2">
          <Webhook className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            Webhooks ({partner.webhooks.length})
          </h2>
        </div>
        {partner.webhooks.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No webhooks registered</p>
        ) : (
          <div className="divide-y divide-border">
            {partner.webhooks.map((wh) => (
              <div key={wh.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-xs font-mono text-foreground truncate">{wh.url}</code>
                  <span className={cn(
                    'text-xs font-medium shrink-0',
                    wh.isActive ? 'text-green-600' : 'text-muted-foreground',
                  )}>
                    {wh.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {wh.events.map((e) => (
                    <span key={e} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent payouts */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 bg-muted/20">
          <h2 className="text-sm font-semibold text-foreground">Recent Payouts</h2>
        </div>
        <div className="divide-y divide-border">
          {partner.recentPayouts.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">No payouts yet</p>
          )}
          {partner.recentPayouts.map((payout) => (
            <div key={payout.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{payout.partnerReference}</p>
                <p className="text-xs text-muted-foreground">
                  {payout.recipient.fullName} — {payout.recipient.bankName}
                </p>
              </div>
              <StatusBadge status={payout.status} />
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-foreground">
                  {formatNaira(Number(payout.nairaAmount))}
                </p>
                <p className="text-xs text-muted-foreground">{formatDate(payout.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPartnerDetailPage() {
  return (
    <AdminGuard>
      <PartnerDetailContent />
    </AdminGuard>
  );
}
