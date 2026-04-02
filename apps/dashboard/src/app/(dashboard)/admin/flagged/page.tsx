'use client';

// apps/dashboard/src/app/(dashboard)/admin/flagged/page.tsx
import { AdminGuard }                      from '@/components/admin/AdminGuard';
import { useFlaggedPayouts, useReleasePayout, useRejectPayout } from '@/hooks/useAdmin';
import { formatNaira, formatDate, cn }     from '@/lib/utils';
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface FlaggedPayout {
  id:               string;
  partnerReference: string;
  nairaAmount:      string;
  createdAt:        string;
  narration:        string | null;
  partner:          { name: string; email: string };
  recipient:        { fullName: string; bankCode: string; bankName: string; accountNumber: string };
}

function FlaggedContent() {
  const { data: payouts, isLoading } = useFlaggedPayouts();
  const releaseMutation = useReleasePayout();
  const rejectMutation  = useRejectPayout();

  const flaggedList = (payouts ?? []) as FlaggedPayout[];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Flagged Queue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Payouts held by compliance checks — review and release or reject
        </p>
      </div>

      {/* Warning banner */}
      <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Compliance Review Required</p>
          <p className="mt-0.5 text-amber-700">
            These payouts were flagged by automated sanctions screening.
            Releasing sends them to the PSP for processing. Rejecting marks them as failed.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && flaggedList.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">All clear</p>
          <p className="text-xs text-muted-foreground mt-1">No flagged payouts awaiting review</p>
        </div>
      )}

      <div className="space-y-4">
        {flaggedList.map((payout) => (
          <div key={payout.id} className="rounded-xl border-2 border-amber-200 bg-amber-50/30 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                    FLAGGED
                  </span>
                  <code className="text-sm font-mono text-foreground">{payout.partnerReference}</code>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Partner</p>
                    <p className="font-medium text-foreground">{payout.partner.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-medium text-foreground">{formatNaira(Number(payout.nairaAmount))}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Recipient</p>
                    <p className="font-medium text-foreground">{payout.recipient.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bank</p>
                    <p className="font-medium text-foreground">{payout.recipient.bankName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account</p>
                    <p className="font-mono text-sm text-foreground">{payout.recipient.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Flagged at</p>
                    <p className="text-foreground">{formatDate(payout.createdAt)}</p>
                  </div>
                  {payout.narration && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Narration</p>
                      <p className="text-foreground">{payout.narration}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => releaseMutation.mutate(payout.id)}
                  disabled={releaseMutation.isPending || rejectMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {releaseMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Release
                </button>
                <button
                  onClick={() => rejectMutation.mutate(payout.id)}
                  disabled={releaseMutation.isPending || rejectMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminFlaggedPage() {
  return (
    <AdminGuard>
      <FlaggedContent />
    </AdminGuard>
  );
}
