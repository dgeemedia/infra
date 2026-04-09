'use client';

// apps/dashboard/src/app/(dashboard)/admin/partners/page.tsx
import { useState }        from 'react';
import { AdminGuard }      from '@/components/admin/AdminGuard';
import {
  useAdminPartners, useSuspendPartner, useActivatePartner,
} from '@/hooks/useAdmin';
import { formatNaira, formatDate, formatNumber, cn } from '@/lib/utils';
import { Users, CheckCircle2, Loader2, AlertTriangle, Plus } from 'lucide-react';

function PartnersContent() {
  const { data: partners, isLoading } = useAdminPartners();
  const suspendMutation  = useSuspendPartner();
  const activateMutation = useActivatePartner();
  const [confirmId,     setConfirmId]     = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'activate' | null>(null);

  function openConfirm(id: string, action: 'suspend' | 'activate') {
    setConfirmId(id);
    setConfirmAction(action);
  }

  async function handleConfirm() {
    if (!confirmId || !confirmAction) return;
    if (confirmAction === 'suspend') {
      await suspendMutation.mutateAsync(confirmId);
    } else {
      await activateMutation.mutateAsync(confirmId);
    }
    setConfirmId(null);
    setConfirmAction(null);
  }

  return (
    <div className="space-y-6">

      {/* Header with Add Partner button */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Partners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage partner accounts across the Elorge platform
          </p>
        </div>
        <a
          href="/admin/partners/new"
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          Add Partner
        </a>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 bg-muted/20 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">
            {isLoading ? 'Loading...' : `${partners?.length ?? 0} Partners`}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Partner', 'Country', 'Status', 'API Keys', 'Payouts', 'Volume Delivered', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && partners?.map((partner) => (
                <tr key={partner.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{partner.name}</p>
                    <p className="text-xs text-muted-foreground">{partner.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{partner.country}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      partner.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-700'
                        : partner.status === 'PENDING_REVIEW'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700',
                    )}>
                      {partner.status === 'PENDING_REVIEW' ? 'Pending' : partner.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {partner.activeApiKeys}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {formatNumber(partner.totalPayouts)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatNaira(partner.deliveredVolumeKobo)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(partner.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a
                        href={`/admin/partners/${partner.id}`}
                        className="rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
                      >
                        View
                      </a>
                      {partner.status !== 'SUSPENDED' ? (
                        <button
                          onClick={() => openConfirm(partner.id, 'suspend')}
                          className="rounded-lg px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirm(partner.id, 'activate')}
                          className="rounded-lg px-2 py-1 text-xs text-green-600 hover:bg-green-50 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && (!partners || partners.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No partners yet.{' '}
                    <a href="/admin/partners/new" className="text-primary hover:underline">Add the first one.</a>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm modal */}
      {confirmId && confirmAction && (
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
                onClick={() => { setConfirmId(null); setConfirmAction(null); }}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={suspendMutation.isPending || activateMutation.isPending}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors',
                  confirmAction === 'suspend'
                    ? 'bg-destructive hover:bg-destructive/90'
                    : 'bg-green-600 hover:bg-green-700',
                )}
              >
                {(suspendMutation.isPending || activateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {confirmAction === 'suspend' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPartnersPage() {
  return (
    <AdminGuard>
      <PartnersContent />
    </AdminGuard>
  );
}