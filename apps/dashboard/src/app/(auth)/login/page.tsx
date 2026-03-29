'use client';

import { useState, FormEvent } from 'react';
import { signIn }              from 'next-auth/react';
import { useRouter }           from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { cn }                  from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
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

        {/* ── Brand ─────────────────────────────────────── */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-2xl font-bold shadow-lg">
            E
          </div>
          <h1 className="text-2xl font-bold text-foreground">Elorge Partner Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage your payouts and API keys
          </p>
        </div>

        {/* ── Card ──────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
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

          {/* Sandbox hint */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Need access? Contact{' '}
            <a href="mailto:support@elorge.com" className="text-primary hover:underline">
              support@elorge.com
            </a>
          </p>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Elorge Technologies Limited
        </p>
      </div>
    </div>
  );
}
