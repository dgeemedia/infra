'use client';

// apps/dashboard/src/app/(auth)/interest/page.tsx
import { useState, FormEvent } from 'react';
import { CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  { code: 'GB', label: 'United Kingdom 🇬🇧' },
  { code: 'US', label: 'United States 🇺🇸'  },
  { code: 'CA', label: 'Canada 🇨🇦'          },
  { code: 'AU', label: 'Australia 🇦🇺'        },
  { code: 'DE', label: 'Germany 🇩🇪'          },
  { code: 'FR', label: 'France 🇫🇷'           },
  { code: 'NG', label: 'Nigeria 🇳🇬'          },
  { code: 'GH', label: 'Ghana 🇬🇭'            },
  { code: 'KE', label: 'Kenya 🇰🇪'            },
  { code: 'ZA', label: 'South Africa 🇿🇦'    },
];

const VOLUMES = [
  'Under £10k/month',
  '£10k – £50k/month',
  '£50k – £200k/month',
  '£200k – £1m/month',
  'Over £1m/month',
  'Not sure yet',
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function InterestPage() {
  const [companyName,     setCompanyName]     = useState('');
  const [email,           setEmail]           = useState('');
  const [country,         setCountry]         = useState('GB');
  const [website,         setWebsite]         = useState('');
  const [estimatedVolume, setEstimatedVolume] = useState('');
  const [message,         setMessage]         = useState('');
  const [loading,         setLoading]         = useState(false);
  const [submitted,       setSubmitted]       = useState(false);
  const [error,           setError]           = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/v1/interest`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          companyName,
          email,
          country,
          website:         website    || undefined,
          estimatedVolume: estimatedVolume || undefined,
          message:         message    || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        throw new Error(data.message ?? 'Submission failed');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Interest Received</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">
            Thank you for your interest in Elorge. Our team will review your application
            and get back to you at <strong>{email}</strong> within 2 business days.
          </p>
          <a
            href="/login"
            className="mt-6 inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-lg">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
            E
          </div>
          <h1 className="text-2xl font-bold text-foreground">Partner with Elorge</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Send NGN payouts to Nigerian bank accounts via our API.
            Tell us about your business and we'll be in touch.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Company Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="FinestPay UK Ltd"
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Business Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tech@yourcompany.com"
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Country <span className="text-destructive">*</span>
                </label>
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
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourcompany.com"
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Estimated Monthly Volume
                </label>
                <select
                  value={estimatedVolume}
                  onChange={(e) => setEstimatedVolume(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select range…</option>
                  {VOLUMES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Tell us about your use case
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. We're a UK fintech sending remittances to Nigerian families on behalf of our customers..."
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !companyName.trim() || !email.trim()}
              className={cn(
                'w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all',
                'flex items-center justify-center gap-2',
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Submitting…' : 'Submit Expression of Interest'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Elorge Technologies Limited ·{' '}
          <a href="mailto:support@elorge.com" className="hover:underline">support@elorge.com</a>
        </p>
      </div>
    </div>
  );
}