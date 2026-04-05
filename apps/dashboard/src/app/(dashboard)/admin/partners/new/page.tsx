'use client';

// apps/dashboard/src/app/(dashboard)/admin/partners/new/page.tsx
import { useState }      from 'react';
import { useRouter }     from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminGuard }    from '@/components/admin/AdminGuard';
import { api, getErrorMessage } from '@/lib/api';
import {
  ArrowLeft, Loader2, CheckCircle2, Copy, Eye, EyeOff,
} from 'lucide-react';
import { copyToClipboard } from '@/lib/utils';

interface CreatedPartner {
  partner: { id: string; name: string; email: string; status: string };
  apiKeys: {
    live:    { fullKey: string; preview: string; id: string };
    sandbox: { fullKey: string; preview: string; id: string };
  };
}

const COUNTRIES = [
  { code: 'GB', label: 'United Kingdom 🇬🇧' },
  { code: 'US', label: 'United States 🇺🇸'  },
  { code: 'CA', label: 'Canada 🇨🇦'          },
  { code: 'NG', label: 'Nigeria 🇳🇬'          },
  { code: 'AU', label: 'Australia 🇦🇺'        },
  { code: 'DE', label: 'Germany 🇩🇪'          },
  { code: 'FR', label: 'France 🇫🇷'           },
];

function AddPartnerContent() {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [country,  setCountry]  = useState('GB');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [created,  setCreated]  = useState<CreatedPartner | null>(null);
  const [copied,   setCopied]   = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ success: boolean; data: CreatedPartner }>(
        '/v1/partners',
        { name, email, country, password },
      );
      return data.data;
    },
    onSuccess: (data) => {
      setCreated(data);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'partners'] });
    },
  });

  async function handleCopy(text: string, key: string) {
    await copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  // ── Success screen — show credentials once ─────────────────
  if (created) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="rounded-xl border-2 border-green-300 bg-green-50 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Partner Created</p>
              <p className="text-sm text-green-700">{created.partner.name} — {created.partner.email}</p>
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            ⚠️ Share these credentials securely with the partner. API keys are shown only once.
          </div>

          {/* Dashboard login */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700">Dashboard Login</p>
            {[
              { label: 'Email',    value: created.partner.email },
              { label: 'Password', value: password              },
              { label: 'Status',   value: 'PENDING_REVIEW — activate via Partners page' },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-white border border-green-200 px-3 py-2">
                <span className="text-xs text-green-700 w-20 shrink-0">{label}</span>
                <code className="text-xs font-mono text-green-900 flex-1 truncate mx-2">{value}</code>
                {label !== 'Status' && (
                  <button onClick={() => handleCopy(value, label)} className="shrink-0">
                    <Copy className={`h-3.5 w-3.5 ${copied === label ? 'text-green-600' : 'text-green-400'}`} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* API keys */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700">API Keys</p>
            {[
              { label: 'Live',    key: 'live',    value: created.apiKeys.live.fullKey    },
              { label: 'Sandbox', key: 'sandbox', value: created.apiKeys.sandbox.fullKey },
            ].map(({ label, key, value }) => (
              <div key={key} className="flex items-center gap-2 rounded-lg bg-white border border-green-200 px-3 py-2">
                <span className="text-xs text-green-700 w-14 shrink-0">{label}</span>
                <code className="text-xs font-mono text-green-900 flex-1 truncate">{value}</code>
                <button onClick={() => handleCopy(value, key)} className="shrink-0">
                  <Copy className={`h-3.5 w-3.5 ${copied === key ? 'text-green-600' : 'text-green-400'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/admin/partners/${created.partner.id}`)}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            View Partner Profile
          </button>
          <button
            onClick={() => router.push('/admin/partners')}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            Back to Partners
          </button>
        </div>
      </div>
    );
  }

  // ── Creation form ──────────────────────────────────────────
  return (
    <div className="max-w-lg space-y-6">
      <a href="/admin/partners"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        All Partners
      </a>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Add New Partner</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a partner account. The partner logs in with these credentials.
          Their status starts as <strong>Pending Review</strong> — activate them once onboarding is complete.
        </p>
      </div>

      {createMutation.isError && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {getErrorMessage(createMutation.error)}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Company Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="FinestPay UK"
            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Contact Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tech@finestpay.co.uk"
            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Temporary Password
          </label>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            The partner uses this to log into their dashboard. Ask them to change it after first login.
          </p>
        </div>

        <button
          onClick={() => createMutation.mutate()}
          disabled={
            createMutation.isPending ||
            !name.trim() ||
            !email.trim() ||
            password.length < 8
          }
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {createMutation.isPending ? 'Creating…' : 'Create Partner'}
        </button>
      </div>
    </div>
  );
}

export default function AddPartnerPage() {
  return (
    <AdminGuard>
      <AddPartnerContent />
    </AdminGuard>
  );
}