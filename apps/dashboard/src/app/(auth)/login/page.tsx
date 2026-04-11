'use client';

// apps/dashboard/src/app/(auth)/login/page.tsx
import { useState, useEffect, FormEvent } from 'react';
import { signIn }                          from 'next-auth/react';
import { useRouter, useSearchParams }      from 'next/navigation';
import { Eye, EyeOff, Loader2 }            from 'lucide-react';
import { cn }                              from '@/lib/utils';

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const wasSuspended = searchParams.get('reason') === 'suspended';

  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [userAgent, setUserAgent] = useState('');

  // Collect real client IP and user agent on mount
  useEffect(() => {
    setUserAgent(navigator.userAgent);

    fetch('https://api.ipify.org?format=json')
      .then((r) => r.json())
      .then((d: { ip: string }) => setIpAddress(d.ip))
      .catch(() => {
        fetch('https://ipapi.co/json/')
          .then((r) => r.json())
          .then((d: { ip: string }) => setIpAddress(d.ip))
          .catch(() => { /* silently fail — API still records server IP */ });
      });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      ipAddress,  // ← real client IP forwarded to API
      userAgent,  // ← real browser UA forwarded to API
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password. Please try again.');
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
            E
          </div>
          <h1 className="text-2xl font-bold text-foreground">Elorge Partner Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your payouts and API keys
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">

          {/* Suspended notice */}
          {wasSuspended && (
            <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Your account has been suspended. Contact{' '}
              <a href="mailto:support@elorge.com" className="font-medium underline">
                support@elorge.com
              </a>{' '}
              to reactivate.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Error banner */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@finestpay.co.uk"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={cn(
                'w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground',
                'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed transition-all',
                'flex items-center justify-center gap-2',
              )}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">New to Elorge?</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Expression of interest CTA */}
          <a
            href="/interest"
            className="block w-full rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Express Interest in Partnering
          </a>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Elorge Technologies Limited
        </p>
      </div>
    </div>
  );
}