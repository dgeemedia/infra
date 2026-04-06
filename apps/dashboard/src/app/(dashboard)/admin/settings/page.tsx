'use client';

// apps/dashboard/src/app/(dashboard)/admin/settings/page.tsx
//
// Reads your receiving account details from the API (which reads .env).
// No hardcoded provider name or fields — works for Wise, Airwallex,
// Mercury, Payoneer, or anything else. Swap provider by updating .env.

import { useState }   from 'react';
import { AdminGuard } from '@/components/admin/AdminGuard';
import {
  useReceivingAccount,
  useAdminBalances,
  useTopUpPartnerBalance,
} from '@/hooks/useAdmin';
import {
  Building2, Copy, CheckCircle2, Info,
  Loader2, DollarSign, Wallet, RefreshCw,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { getErrorMessage } from '@/lib/api';

// ── Copy button ───────────────────────────────────────────────
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    if (!value?.trim()) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button onClick={handleCopy} disabled={!value?.trim()}
      className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
      title="Copy">
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ── Account detail row ────────────────────────────────────────
function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <span className="w-40 shrink-0 text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-1 items-center gap-1 min-w-0">
        <code className="flex-1 text-sm font-mono text-foreground truncate">{value}</code>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

// ── Currency section ──────────────────────────────────────────
// Renders whatever key/value pairs the env has for that currency.
// Completely provider-agnostic — no currency-specific if statements.
const FIELD_LABELS: Record<string, string> = {
  accountName:        'Account name',
  accountNumber:      'Account number',
  sortCode:           'Sort code',
  achRouting:         'ACH routing',
  wireRouting:        'Wire routing',
  swiftBic:           'SWIFT / BIC',
  iban:               'IBAN',
  institutionNumber:  'Institution number',
  transitNumber:      'Transit number',
};

const CURRENCY_META: Record<string, { flag: string; label: string }> = {
  gbp: { flag: '🇬🇧', label: 'GBP' },
  usd: { flag: '🇺🇸', label: 'USD' },
  eur: { flag: '🇪🇺', label: 'EUR' },
  cad: { flag: '🇨🇦', label: 'CAD' },
};

function CurrencySection({ code, data }: { code: string; data: Record<string, string> }) {
  const meta   = CURRENCY_META[code] ?? { flag: '🌐', label: code.toUpperCase() };
  const fields = Object.entries(data).filter(([, v]) => v);
  if (fields.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">{meta.flag}</span>
        <h3 className="text-sm font-semibold text-foreground">{meta.label} account</h3>
      </div>
      {fields.map(([key, value]) => (
        <DetailRow key={key} label={FIELD_LABELS[key] ?? key} value={value} />
      ))}
    </div>
  );
}

// ── Top-up modal ──────────────────────────────────────────────
function TopUpModal({ partnerId, partnerName, onClose }: {
  partnerId:   string;
  partnerName: string;
  onClose:     () => void;
}) {
  const [amountGbp,   setAmountGbp]   = useState('');
  const [description, setDescription] = useState('');
  const topUp = useTopUpPartnerBalance();

  async function handleSubmit() {
    const pence = Math.round(parseFloat(amountGbp) * 100);
    if (!pence || !description.trim()) return;
    await topUp.mutateAsync({ partnerId, amountPence: pence, description });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Top up balance</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{partnerName}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Amount (GBP)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">£</span>
              <input type="number" min="1" step="0.01" value={amountGbp}
                onChange={(e) => setAmountGbp(e.target.value)} placeholder="100.00"
                className="w-full rounded-lg border border-input bg-background pl-7 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Payment reference / note</label>
            <input type="text" value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wise TW-REF-12345 received 2026-04-05"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {topUp.isError && (
            <p className="text-sm text-destructive">{getErrorMessage(topUp.error)}</p>
          )}
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={handleSubmit}
            disabled={topUp.isPending || !amountGbp || !description.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {topUp.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm credit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main settings content ─────────────────────────────────────
function AdminSettingsContent() {
  const { data: account,  isLoading: acctLoading  } = useReceivingAccount();
  const { data: balances, isLoading: balsLoading  } = useAdminBalances();
  const [topUpTarget, setTopUpTarget] = useState<{ id: string; name: string } | null>(null);

  const currencies = account
    ? Object.entries(account).filter(([k]) => k !== 'provider') as [string, Record<string, string>][]
    : [];

  const hasCurrencies = currencies.some(([, data]) =>
    Object.values(data).some((v) => v),
  );

  return (
    <div className="space-y-8 max-w-3xl">

      {/* ── Section 1: Receiving account ───────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
            <p className="text-sm text-muted-foreground">
              Receiving account · Partner balances · Top-ups
            </p>
          </div>
        </div>

        {/* Provider badge */}
        {acctLoading ? (
          <div className="h-8 w-40 rounded bg-muted animate-pulse" />
        ) : account?.provider ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Provider: {account.provider}</span>
            <span className="text-xs text-muted-foreground">· set via RECEIVING_PROVIDER in .env</span>
          </div>
        ) : null}

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            These details come from your server <code className="font-mono text-xs">.env</code> file.
            To update them or switch providers, edit <code className="font-mono text-xs">.env</code> and redeploy — no code changes needed.
            Copy the relevant currency block into each partner's top-up instruction email.
          </p>
        </div>

        {/* Currency cards */}
        {acctLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!acctLoading && !hasCurrencies && (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No account details configured</p>
            <p className="mt-1 text-xs text-muted-foreground max-w-xs mx-auto">
              Fill in the <code className="font-mono text-xs">RECEIVING_*</code> variables in your <code className="font-mono text-xs">.env</code> file and redeploy.
            </p>
          </div>
        )}

        {!acctLoading && hasCurrencies && (
          <div className="grid gap-4 sm:grid-cols-2">
            {currencies.map(([code, data]) => (
              <CurrencySection key={code} code={code} data={data} />
            ))}
          </div>
        )}
      </div>

      {/* ── Section 2: Partner balances + top-up ───────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Partner Balances</h2>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Partner', 'Balance (GBP)', 'Last top-up', 'Top up'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {balsLoading && Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    {[0,1,2,3].map((j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-muted animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

                {!balsLoading && (balances?.partners ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'font-semibold tabular-nums',
                        p.balancePence <= 0 ? 'text-red-600' : 'text-foreground',
                      )}>
                        £{p.balanceGbp}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.lastTopUp
                        ? <>£{(p.lastTopUp.amountPence / 100).toFixed(2)} — {p.lastTopUp.description.slice(0, 30)}</>
                        : <span className="italic">Never</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setTopUpTarget({ id: p.id, name: p.name })}
                        className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                        <RefreshCw className="h-3 w-3" />
                        Top up
                      </button>
                    </td>
                  </tr>
                ))}

                {!balsLoading && (balances?.partners ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      No partners yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top-up modal */}
      {topUpTarget && (
        <TopUpModal
          partnerId={topUpTarget.id}
          partnerName={topUpTarget.name}
          onClose={() => setTopUpTarget(null)}
        />
      )}
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <AdminGuard>
      <AdminSettingsContent />
    </AdminGuard>
  );
}