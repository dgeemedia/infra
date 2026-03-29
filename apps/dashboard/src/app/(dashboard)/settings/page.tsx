'use client';

import { useState }    from 'react';
import { useSession }  from 'next-auth/react';
import {
  Building2, Mail, Globe, Shield,
  CheckCircle2, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate API call
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Manage your partner account and integration details
        </p>
      </div>

      {/* ── Success banner ──────────────────────────────── */}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Settings saved successfully
        </div>
      )}

      {/* ── Company info form ───────────────────────────── */}
      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          Company Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Company Name
            </label>
            <input
              type="text"
              defaultValue={session?.user?.name ?? ''}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Contact Email
            </label>
            <input
              type="email"
              defaultValue={session?.user?.email ?? ''}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Country
            </label>
            <select className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="GB">United Kingdom 🇬🇧</option>
              <option value="US">United States 🇺🇸</option>
              <option value="CA">Canada 🇨🇦</option>
              <option value="NG">Nigeria 🇳🇬</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Website
            </label>
            <input
              type="url"
              defaultValue="https://finestpay.co.uk"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* ── Integration Details ─────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          Integration Details
        </h2>

        <div className="space-y-3">
          {[
            { label: 'Partner ID',        value: (session?.user as { id?: string } | undefined)?.id ?? 'N/A' },
            { label: 'API Base URL',      value: 'https://api.elorge.com' },
            { label: 'Sandbox Base URL',  value: 'https://sandbox.elorge.com' },
            { label: 'API Version',       value: 'v1' },
            { label: 'Auth Method',       value: 'Bearer token (Authorization header)' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <code className="text-sm font-mono text-foreground">{value}</code>
            </div>
          ))}
        </div>

        <a
          href="http://localhost:3001/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Globe className="h-4 w-4" />
          Open API Documentation
        </a>
      </div>

      {/* ── Security ────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Security
        </h2>

        <div className="space-y-3">
          {/* Allowed IPs note */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              IP Allowlist (coming soon)
            </label>
            <input
              type="text"
              disabled
              placeholder="e.g. 1.2.3.4, 5.6.7.8"
              className="w-full rounded-lg border border-input bg-muted px-3.5 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Restrict API access to specific IP addresses. Contact support to enable.
            </p>
          </div>
        </div>
      </div>

      {/* ── Danger zone ─────────────────────────────────── */}
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-base font-semibold text-destructive mb-2">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Suspending your account will immediately stop all API access and webhook delivery.
          Contact Elorge support to reactivate.
        </p>
        <button
          className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          onClick={() => alert('Please contact support@elorge.com to request account suspension.')}
        >
          Request Account Suspension
        </button>
      </div>

    </div>
  );
}
