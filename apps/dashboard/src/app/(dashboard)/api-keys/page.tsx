'use client';

import { useState }                                    from 'react';
import { useSession }                                  from 'next-auth/react';
import {
  Copy, Eye, EyeOff, Key, Loader2,
  Plus, ShieldOff, AlertTriangle,
} from 'lucide-react';
import { useApiKeys, useGenerateApiKey, useRevokeApiKey } from '@/hooks/useApiKeys';
import { copyToClipboard, formatDate, maskApiKey, cn }    from '@/lib/utils';
import type { ApiKeyCreated }                              from '@elorge/types';

export default function ApiKeysPage() {
  const { data: session } = useSession();
  const partnerId = (session?.user as { id?: string } | undefined)?.id ?? '';

  const { data: keys, isLoading }   = useApiKeys(partnerId);
  const generateMutation            = useGenerateApiKey(partnerId);
  const revokeMutation              = useRevokeApiKey(partnerId);

  const [showForm,   setShowForm]   = useState(false);
  const [label,      setLabel]      = useState('');
  const [env,        setEnv]        = useState<'live' | 'sandbox'>('live');
  const [newKey,     setNewKey]     = useState<ApiKeyCreated | null>(null);
  const [copied,     setCopied]     = useState(false);
  const [revokeId,   setRevokeId]   = useState<string | null>(null);

  async function handleGenerate() {
    if (!label.trim()) return;
    const result = await generateMutation.mutateAsync({ label, environment: env });
    setNewKey(result);
    setLabel('');
    setShowForm(false);
  }

  async function handleCopy(text: string) {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke(keyId: string) {
    await revokeMutation.mutateAsync(keyId);
    setRevokeId(null);
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage keys used by FinestPay and other partners to authenticate API requests
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Key
        </button>
      </div>

      {/* ── New key revealed after generation ─────────────── */}
      {newKey && (
        <div className="rounded-xl border-2 border-green-300 bg-green-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
              <Key className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-800">API Key Generated</p>
              <p className="mt-1 text-sm text-green-700">
                Copy this key now — it will never be shown again.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-white border border-green-200 px-3 py-2 text-xs font-mono text-foreground break-all">
                  {newKey.fullKey}
                </code>
                <button
                  onClick={() => handleCopy(newKey.fullKey)}
                  className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                >
                  {copied ? 'Copied!' : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-4 text-xs text-green-700 hover:underline"
          >
            I've saved this key — dismiss
          </button>
        </div>
      )}

      {/* ── Generate form ──────────────────────────────── */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground mb-4">Generate New API Key</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Key Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Production Key, FinestPay Live"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Environment
              </label>
              <div className="flex gap-2">
                {(['live', 'sandbox'] as const).map((e) => (
                  <button
                    key={e}
                    onClick={() => setEnv(e)}
                    className={cn(
                      'flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors',
                      env === e
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-background border-border text-muted-foreground hover:border-primary/50',
                    )}
                  >
                    {e === 'live' ? '🔴 Live' : '🟡 Sandbox'}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {env === 'live'
                  ? 'Live keys process real transactions. Keep them secret.'
                  : 'Sandbox keys only work with the sandbox API — safe for testing.'}
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleGenerate}
                disabled={!label.trim() || generateMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {generateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Generate Key
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Key list ───────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 bg-muted/20">
          <h2 className="text-sm font-semibold text-foreground">Active Keys</h2>
        </div>

        {isLoading && (
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-4 w-48 rounded bg-muted animate-pulse" />
                <div className="h-4 w-24 rounded bg-muted animate-pulse ml-auto" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!keys || keys.length === 0) && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No active API keys. Generate your first key above.
          </div>
        )}

        <div className="divide-y divide-border">
          {keys?.map((key) => (
            <div key={key.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Key className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{key.label}</p>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    key.environment === 'live'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700',
                  )}>
                    {key.environment}
                  </span>
                </div>
                <code className="mt-0.5 text-xs font-mono text-muted-foreground">
                  {maskApiKey(key.keyPreview)}
                </code>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Created {formatDate(key.createdAt)}
                  {key.lastUsedAt ? ` · Last used ${formatDate(key.lastUsedAt)}` : ' · Never used'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(key.keyPreview)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title="Copy key preview"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setRevokeId(key.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Revoke key"
                >
                  <ShieldOff className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Revoke confirm modal ─────────────────────────── */}
      {revokeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mt-4 text-center text-base font-semibold text-foreground">
              Revoke API Key?
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              This key will stop working immediately. Any integration using it will break. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setRevokeId(null)}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRevoke(revokeId)}
                disabled={revokeMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 transition-colors"
              >
                {revokeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Revoke Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Security note ───────────────────────────────── */}
      <div className="rounded-xl bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Security best practices</p>
        <ul className="space-y-1 list-disc list-inside text-xs">
          <li>Never expose live API keys in client-side code or public repositories</li>
          <li>Use sandbox keys for development and testing only</li>
          <li>Rotate keys every 90 days or immediately if compromised</li>
          <li>Revoke unused keys to minimise attack surface</li>
        </ul>
      </div>
    </div>
  );
}
