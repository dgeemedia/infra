// apps/dashboard/src/app/(dashboard)/webhooks/page.tsx
'use client';

import { useState }         from 'react';
import { useSession }       from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, Plus, Webhook, Copy,
  CheckCircle2, XCircle, ExternalLink,
} from 'lucide-react';
import { api }              from '@/lib/api';
import { copyToClipboard, formatDate, cn } from '@/lib/utils';
import type { WebhookConfig, WebhookEventType } from '@elorge/types';

const ALL_EVENTS: WebhookEventType[] = [
  'payout.delivered',
  'payout.failed',
  'payout.processing',
  'payout.flagged',
];

const EVENT_LABELS: Record<WebhookEventType, string> = {
  'payout.delivered':  'Payout Delivered — fires when Naira lands in recipient account',
  'payout.failed':     'Payout Failed — fires when all PSP retries are exhausted',
  'payout.processing': 'Payout Processing — fires when payout is sent to PSP',
  'payout.flagged':    'Payout Flagged — fires when sanctions check holds a payout',
};

export default function WebhooksPage() {
  const { data: session }  = useSession();
  const partnerId = (session?.user as { id?: string } | undefined)?.id ?? '';
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [url,      setUrl]      = useState('');
  const [events,   setEvents]   = useState<WebhookEventType[]>(['payout.delivered', 'payout.failed']);
  const [secret,   setSecret]   = useState('');
  const [copied,   setCopied]   = useState(false);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks', partnerId],
    queryFn:  async () => {
      const { data } = await api.get<{ success: boolean; data: WebhookConfig[] }>(
        '/v1/webhooks',
      );
      return data.data;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ success: boolean; data: { id: string; secret: string } }>(
        '/v1/webhooks',
        { url, events },
      );
      return data.data;
    },
    onSuccess: (result) => {
      setSecret(result.secret);
      setUrl('');
      setEvents(['payout.delivered', 'payout.failed']);
      void queryClient.invalidateQueries({ queryKey: ['webhooks', partnerId] });
    },
  });

  function toggleEvent(event: WebhookEventType) {
    setEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  async function handleCopy(text: string) {
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 max-w-3xl">

      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Webhooks</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Register endpoints to receive real-time payout status events
          </p>
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); setSecret(''); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Webhook
        </button>
      </div>

      {/* ── Secret revealed after registration ─────────── */}
      {secret && (
        <div className="rounded-xl border-2 border-green-300 bg-green-50 p-5">
          <p className="font-semibold text-green-800">Webhook Registered</p>
          <p className="mt-1 text-sm text-green-700">
            Save this signing secret — it will not be shown again.
            Use it to verify that webhook payloads come from Elorge.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white border border-green-200 px-3 py-2 text-xs font-mono break-all">
              {secret}
            </code>
            <button
              onClick={() => handleCopy(secret)}
              className="shrink-0 rounded-lg bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700 transition-colors"
            >
              {copied ? 'Copied!' : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <button onClick={() => setSecret('')} className="mt-3 text-xs text-green-700 hover:underline">
            I've saved the secret — dismiss
          </button>
        </div>
      )}

      {/* ── Register form ──────────────────────────────── */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Register Webhook Endpoint</h2>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Endpoint URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.finestpay.co.uk/webhooks/elorge"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Must be an HTTPS URL that returns 2xx within 10 seconds.
            </p>
          </div>

          {/* Events */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Events to Subscribe
            </label>
            <div className="space-y-2">
              {ALL_EVENTS.map((event) => (
                <label
                  key={event}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                    events.includes(event)
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border hover:bg-muted/30',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="mt-0.5 h-4 w-4 rounded accent-primary"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{event}</p>
                    <p className="text-xs text-muted-foreground">{EVENT_LABELS[event]}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => registerMutation.mutate()}
              disabled={!url || events.length === 0 || registerMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {registerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Register Webhook
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Webhook list ───────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border px-5 py-3.5 bg-muted/20">
          <h2 className="text-sm font-semibold text-foreground">Registered Endpoints</h2>
        </div>

        {isLoading && (
          <div className="px-5 py-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          </div>
        )}

        {!isLoading && (!webhooks || webhooks.length === 0) && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No webhooks registered. Add your first endpoint above.
          </div>
        )}

        <div className="divide-y divide-border">
          {webhooks?.map((wh) => (
            <div key={wh.id} className="p-5 hover:bg-muted/10 transition-colors">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                  <Webhook className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-foreground truncate">{wh.url}</code>
                    <a
                      href={wh.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {formatDate(wh.createdAt)}
                  </p>
                  {/* Events */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(wh.events as string[]).map((event) => (
                      <span
                        key={event}
                        className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                      >
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
                {/* Status */}
                <div>
                  {wh.isActive ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <XCircle className="h-3.5 w-3.5" /> Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Signature verification guide ─────────────── */}
      <div className="rounded-xl bg-muted/50 border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">Verifying Webhook Signatures</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Every webhook includes an <code className="bg-muted px-1 py-0.5 rounded text-xs">X-Elorge-Signature</code> header.
          Verify it in your endpoint:
        </p>
        <pre className="rounded-lg bg-foreground/5 border border-border p-3 text-xs font-mono overflow-x-auto text-foreground">
{`const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return \`sha256=\${expected}\` === signature;
}`}
        </pre>
      </div>
    </div>
  );
}
