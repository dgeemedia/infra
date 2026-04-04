'use client';

// apps/dashboard/src/app/(dashboard)/admin/partners/[id]/page.tsx
import { useParams }   from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminGuard }  from '@/components/admin/AdminGuard';
import { StatusBadge } from '@/components/transactions/StatusBadge';
import { api }         from '@/lib/api';
import {
  formatNaira, formatDate, formatNumber, maskApiKey, cn,
} from '@/lib/utils';
import {
  ArrowLeft, Key, Webhook, ArrowRightLeft,
  CheckCircle2, XCircle, Clock, Loader2, AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';

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
  webhookConfigs?: Array<{
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
    recipient:        { fullName: string; bankName: string } | null;
  }>;
}

function PartnerDetailContent() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | null>(null);

  const { data: partner, isLoading } = useQuery({
    queryKey: ['admin', 'partner', id],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: PartnerDetail }>(
        `/v1/admin/partners/${id}`,
      );
      return data.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async () => { await api.patch(`/v1/admin/partners/${id}/suspend`); },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partner', id] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      setConfirmAction(null);
    },
  });

  const activateMutation = useMutation({
    mutationFn: async () => { await api.patch(`/v1/admin/partners/${id}/activate`); },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partner', id] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      setConfirmAction(null);
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

  // The API returns webhookConfigs (relation name) — normalise to webhooks
  const webhooks = partner.webhooks ?? partner.webhookConfigs ?? [];
  const apiKeys  = partner.apiKeys  ?? [];
  const recentPayouts = partner.recentPayouts ?? [];

  // Build stat map from payoutStats array
  const statMap: Record<string, number> = {};
  for (const s of (partner.payoutStats ?? [])) {
    statMap[s.status] = s._count.id;
  }
  const total     = Object.values(statMap).reduce((a, b) => a + b, 0);
  const delivered = statMap['DELIVERED'] ?? 0;
  const failed    = statMap['FAILED']    ?? 0;
  const pending   = (statMap['PENDING'] ?? 0) + (statMap['PROCESSING'] ?? 0);

  const isPending = suspendMutation.isPending || activateMutation.isPending;

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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{partner.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{partner.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'rounded-full px-3 py-1 text-sm font-medium',
            partner.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700',
          )}>
            {partner.status}
          </span>
          {partner.status === 'ACTIVE' ? (
            <button
              onClick={() => setConfirmAction('suspend')}
              className="rounded-lg border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              Suspend
            </button>
          ) : (
            <button
              onClick={() => setConfirmAction('activate')}
              className="rounded-lg border border-green-400 px-3 py-1.5 text-sm text-green-700 hover:bg-green-50 transition-colors"
            >
              Activate
            </button>
          )}
        </div>
      </div>

      {/* Payout stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total',     value: total,     icon: ArrowRightLeft, color: 'blue'  },
          { label: 'Delivered', value: delivered, icon: CheckCircle2,   color: 'green' },
          { label: 'Failed',    value: failed,    icon: XCircle,        color: 'red'   },
          { label: 'Pending',   value: pending,   icon: Clock,          color: 'amber' },
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
            Active API Keys ({apiKeys.length})
          </h2>
        </div>
        {apiKeys.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No active keys</p>
        ) : (
          <div className="divide-y divide-border">
            {apiKeys.map((key) => (
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
            Webhooks ({webhooks.length})
          </h2>
        </div>
        {webhooks.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No webhooks registered</p>
        ) : (
          <div className="divide-y divide-border">
            {webhooks.map((wh) => (
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
                  {(wh.events ?? []).map((e) => (
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
          {recentPayouts.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">No payouts yet</p>
          )}
          {recentPayouts.map((payout) => (
            <div key={payout.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{payout.partnerReference}</p>
                <p className="text-xs text-muted-foreground">
                  {payout.recipient
                    ? `${payout.recipient.fullName} — ${payout.recipient.bankName}`
                    : '—'}
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

      {/* Confirm modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full mx-auto',
              confirmAction === 'suspend' ? 'bg-destructive/10' : 'bg-green-100',
            )}>
              {confirmAction === 'suspend'
                ? <AlertTriangle className="h-6 w-6 text-destructive" />
                : <CheckCircle2  className="h-6 w-6 text-green-600" />
              }
            </div>
            <h2 className="mt-4 text-center text-base font-semibold text-foreground">
              {confirmAction === 'suspend' ? 'Suspend Partner?' : 'Activate Partner?'}
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {confirmAction === 'suspend'
                ? 'This will immediately block all API access for this partner.'
                : 'This will restore full API access for this partner.'
              }
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmAction === 'suspend'
                  ? suspendMutation.mutate()
                  : activateMutation.mutate()
                }
                disabled={isPending}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors',
                  confirmAction === 'suspend'
                    ? 'bg-destructive hover:bg-destructive/90'
                    : 'bg-green-600 hover:bg-green-700',
                )}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {confirmAction === 'suspend' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
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