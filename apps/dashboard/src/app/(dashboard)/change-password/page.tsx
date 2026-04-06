'use client';

// apps/dashboard/src/app/(dashboard)/change-password/page.tsx
//
// Shown automatically when session.user.mustChangePassword === true.
// The dashboard layout redirects here before allowing any other page.
// Once the partner sets a new password they are signed out and asked
// to log in again — this refreshes the session token so mustChangePassword
// is cleared and they land on the normal dashboard.

import { useState }   from 'react';
import { signOut }    from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import { KeyRound, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function ChangePasswordPage() {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNew,  setShowNew]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (next !== confirm) throw new Error('New passwords do not match.');
      if (next.length < 8)  throw new Error('Password must be at least 8 characters.');
      await api.patch('/v1/partners/me/password', {
        currentPassword: current,
        newPassword:     next,
      });
    },
    onSuccess: () => {
      setDone(true);
      // Sign out after 2s so the partner logs back in with a fresh token
      setTimeout(() => signOut({ callbackUrl: '/login?reason=password-changed' }), 2000);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (done) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <p className="text-base font-semibold text-foreground">Password updated!</p>
          <p className="text-sm text-muted-foreground">Signing you out so you can log in with your new password…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Set Your Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You're using a temporary password. Please set a permanent one before continuing.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Current (temp) password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Temporary Password
            </label>
            <div className="relative">
              <input
                type={showCur ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="The password you received"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShowCur((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm new password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              className={cn(
                'w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                confirm && next !== confirm ? 'border-destructive' : 'border-input',
              )}
            />
            {confirm && next !== confirm && (
              <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>

          <button
            onClick={() => { setError(''); mutation.mutate(); }}
            disabled={
              mutation.isPending ||
              !current || !next || !confirm ||
              next !== confirm || next.length < 8
            }
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {mutation.isPending ? 'Updating…' : 'Set Password & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}