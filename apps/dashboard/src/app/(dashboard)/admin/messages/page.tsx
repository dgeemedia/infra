'use client';

// apps/dashboard/src/app/(dashboard)/admin/messages/page.tsx
import { useState }      from 'react';
import { useRouter }     from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminGuard }    from '@/components/admin/AdminGuard';
import { api, getErrorMessage } from '@/lib/api';
import {
  Mail, MailOpen, Loader2, Users, Eye,
  ExternalLink, CheckCircle2, Copy, EyeOff,
} from 'lucide-react';
import { timeAgo, formatDate, cn, copyToClipboard } from '@/lib/utils';

interface InboxMessage {
  id:        string;
  type:      string;
  title:     string;
  body:      string;
  read:      boolean;
  createdAt: string;
  metadata:  {
    companyName?:     string;
    email?:           string;
    country?:         string;
    website?:         string;
    estimatedVolume?: string;
    message?:         string;
    submittedAt?:     string;
  } | null;
}

interface CreatedPartner {
  partner: { id: string; name: string; email: string };
  apiKeys: {
    live:    { fullKey: string };
    sandbox: { fullKey: string };
  };
}

const COUNTRIES: Record<string, string> = {
  GB: '🇬🇧 United Kingdom', US: '🇺🇸 United States', CA: '🇨🇦 Canada',
  AU: '🇦🇺 Australia',      DE: '🇩🇪 Germany',       FR: '🇫🇷 France',
  NG: '🇳🇬 Nigeria',         GH: '🇬🇭 Ghana',          KE: '🇰🇪 Kenya',
  ZA: '🇿🇦 South Africa',
};

function MessagesContent() {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [selected,   setSelected]   = useState<InboxMessage | null>(null);
  const [registering, setRegistering] = useState(false);
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]    = useState(false);
  const [created,    setCreated]    = useState<CreatedPartner | null>(null);
  const [copied,     setCopied]     = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'inbox'],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: {
        messages: InboxMessage[];
        total:    number;
      } }>('/v1/admin/inbox');
      return data.data;
    },
    staleTime:       30_000,
    refetchInterval: 60_000,
  });

  // Mark as read when selected
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/v1/notifications/${id}/read`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'inbox'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Register prospect as a partner
  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!selected?.metadata) throw new Error('No prospect selected');
      const { data } = await api.post<{ success: boolean; data: CreatedPartner }>(
        '/v1/partners',
        {
          name:     selected.metadata.companyName ?? '',
          email:    selected.metadata.email       ?? '',
          country:  selected.metadata.country     ?? 'GB',
          password,
        },
      );
      return data.data;
    },
    onSuccess: (result) => {
      setCreated(result);
      setRegistering(false);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
    },
  });

  function openMessage(msg: InboxMessage) {
    setSelected(msg);
    setCreated(null);
    setRegistering(false);
    setPassword('');
    if (!msg.read) markReadMutation.mutate(msg.id);
  }

  async function handleCopy(text: string, key: string) {
    await copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const messages = data?.messages ?? [];
  const unread   = messages.filter((m) => !m.read).length;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">

      {/* ── Left: message list ──────────────────────────────── */}
      <div className="w-80 shrink-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Inbox</h2>
            {unread > 0 && (
              <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5">
                {unread}
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{data?.total ?? 0} total</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {isLoading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-4 rounded bg-muted animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
            </div>
          ))}

          {!isLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MailOpen className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No messages yet.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Interest submissions will appear here.
              </p>
            </div>
          )}

          {!isLoading && messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={cn(
                'w-full text-left p-4 hover:bg-muted/40 transition-colors',
                selected?.id === msg.id && 'bg-primary/5 border-r-2 border-primary',
                !msg.read && 'bg-blue-50/50',
              )}
            >
              <div className="flex items-start gap-2">
                {!msg.read
                  ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  : <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-transparent" />
                }
                <div className="min-w-0">
                  <p className={cn('text-sm truncate', !msg.read ? 'font-semibold text-foreground' : 'text-foreground')}>
                    {msg.metadata?.companyName ?? msg.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {msg.metadata?.email ?? ''}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(msg.createdAt)}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: message detail ───────────────────────────── */}
      <div className="flex-1 rounded-xl border border-border bg-card shadow-sm overflow-y-auto">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <MailOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-base font-medium text-foreground">Select a message</p>
            <p className="text-sm text-muted-foreground mt-1">
              Partner interest submissions appear in the inbox on the left.
            </p>
          </div>
        ) : created ? (
          // ── Registration success ─────────────────────────
          <div className="p-6 space-y-5 max-w-lg">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Partner registered!</p>
                <p className="text-sm text-green-700">{created.partner.name}</p>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              ⚠️ Copy and share these credentials securely. API keys shown only once.
            </div>

            {[
              { label: 'Email',       value: created.partner.email, key: 'email' },
              { label: 'Password',    value: password,              key: 'pwd'   },
              { label: 'Live key',    value: created.apiKeys.live.fullKey,    key: 'live'    },
              { label: 'Sandbox key', value: created.apiKeys.sandbox.fullKey, key: 'sandbox' },
            ].map(({ label, value, key }) => (
              <div key={key} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
                <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
                <code className="text-xs font-mono text-foreground flex-1 truncate">{value}</code>
                <button onClick={() => handleCopy(value, key)} className="shrink-0">
                  <Copy className={cn('h-3.5 w-3.5', copied === key ? 'text-green-600' : 'text-muted-foreground')} />
                </button>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.push(`/admin/partners/${created.partner.id}`)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Eye className="h-4 w-4" />
                View partner profile
              </button>
              <button
                onClick={() => setCreated(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
              >
                Back to message
              </button>
            </div>
          </div>
        ) : (
          // ── Message detail ───────────────────────────────
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {selected.metadata?.companyName ?? 'Unnamed company'}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatDate(selected.createdAt)}
                </p>
              </div>
              {!registering && (
                <button
                  onClick={() => setRegistering(true)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                >
                  <Users className="h-4 w-4" />
                  Register as Partner
                </button>
              )}
            </div>

            {/* Metadata fields */}
            {selected.metadata && (
              <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border overflow-hidden">
                {[
                  { label: 'Email',   value: selected.metadata.email   },
                  { label: 'Country', value: selected.metadata.country ? COUNTRIES[selected.metadata.country] ?? selected.metadata.country : undefined },
                  { label: 'Website', value: selected.metadata.website  },
                  { label: 'Est. volume', value: selected.metadata.estimatedVolume },
                ].filter(({ value }) => value).map(({ label, value }) => (
                  <div key={label} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
                    <div className="flex items-center gap-1 min-w-0 flex-1">
                      <span className="text-sm text-foreground truncate">{value}</span>
                      {label === 'Website' && value && (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Message body */}
            {selected.metadata?.message && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Message</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selected.metadata.message}</p>
              </div>
            )}

            {/* Register form */}
            {registering && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Register {selected.metadata?.companyName} as a partner</h3>
                <p className="text-xs text-muted-foreground">
                  This will create a dashboard account with <strong>Pending Review</strong> status.
                  Activate them from the Partners page once onboarding is complete.
                </p>

                {registerMutation.isError && (
                  <p className="text-sm text-destructive">{getErrorMessage(registerMutation.error)}</p>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Temporary Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => registerMutation.mutate()}
                    disabled={registerMutation.isPending || password.length < 8}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {registerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirm & Register
                  </button>
                  <button
                    onClick={() => setRegistering(false)}
                    className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminMessagesPage() {
  return (
    <AdminGuard>
      <MessagesContent />
    </AdminGuard>
  );
}