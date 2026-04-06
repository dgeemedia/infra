'use client';

// apps/dashboard/src/app/(dashboard)/admin/pending/page.tsx
import { useState }   from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api }        from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import {
  Clock, CheckCircle2, XCircle, Loader2, AlertTriangle, Users,
} from 'lucide-react';

interface PendingPartner {
  id:        string;
  name:      string;
  email:     string;
  country:   string;
  createdAt: string;
  status:    string;
}

function PendingContent() {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [action,    setAction]    = useState<'activate' | 'reject' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'pending'],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: PendingPartner[] }>(
        '/v1/admin/partners',
      );
      return (data.data ?? []).filter((p) => p.status === 'PENDING_REVIEW');
    },
    staleTime: 30_000,
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/v1/admin/partners/${id}/activate`); },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setConfirmId(null); setAction(null);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async (id: string) => { await api.patch(`/v1/admin/partners/${id}/suspend`); },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'pending'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
      setConfirmId(null); setAction(null);
    },
  });

  const partners = data ?? [];
  const isPending = activateMutation.isPending || suspendMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pending Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          New partners waiting to be onboarded. Activate them once you have completed KYB verification.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 bg-muted/20 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold text-foreground">
            {isLoading ? 'Loading…' : `${partners.length} Pending`}
          </h2>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && partners.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Users className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No partners pending review.</p>
            <a href="/admin/partners/new"
              className="text-sm text-primary hover:underline">
              Add a new partner →
            </a>
          </div>
        )}

        {!isLoading && partners.length > 0 && (
          <div className="divide-y divide-border">
            {partners.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-semibold text-sm">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.email} · {p.country}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Registered {formatDate(p.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={`/admin/partners/${p.id}`}
                    className="rounded-lg px-3 py-1.5 text-xs text-primary hover:bg-primary/10 border border-primary/20 transition-colors">
                    View
                  </a>
                  <button onClick={() => { setConfirmId(p.id); setAction('activate'); }}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors">
                    Activate
                  </button>
                  <button onClick={() => { setConfirmId(p.id); setAction('reject'); }}
                    className="rounded-lg px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 border border-destructive/20 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {confirmId && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full mx-auto',
              action === 'activate' ? 'bg-green-100' : 'bg-destructive/10',
            )}>
              {action === 'activate'
                ? <CheckCircle2 className="h-6 w-6 text-green-600" />
                : <AlertTriangle className="h-6 w-6 text-destructive" />
              }
            </div>
            <h2 className="mt-4 text-center text-base font-semibold text-foreground">
              {action === 'activate' ? 'Activate Partner?' : 'Reject Partner?'}
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {action === 'activate'
                ? 'This will give them full API access and allow them to initiate payouts.'
                : 'This will suspend the account. The partner will need to contact support to reapply.'
              }
            </p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => { setConfirmId(null); setAction(null); }}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (action === 'activate') activateMutation.mutate(confirmId);
                  else                       suspendMutation.mutate(confirmId);
                }}
                disabled={isPending}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors',
                  action === 'activate' ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90',
                )}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {action === 'activate' ? 'Activate' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PendingReviewPage() {
  return <AdminGuard><PendingContent /></AdminGuard>;
}