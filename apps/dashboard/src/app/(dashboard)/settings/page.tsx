'use client';

// apps/dashboard/src/app/(dashboard)/settings/page.tsx
import { useState }    from 'react';
import { useSession }  from 'next-auth/react';
import { signOut }     from 'next-auth/react';
import { useMutation } from '@tanstack/react-query';
import {
  Building2, Globe, Shield, KeyRound,
  CheckCircle2, Loader2, AlertTriangle, Eye, EyeOff,
} from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { data: session } = useSession();

  const [saved,   setSaved]   = useState(false);
  const [saving,  setSaving]  = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [pwdError,   setPwdError]   = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [suspendError,       setSuspendError]       = useState('');

  const changePwdMutation = useMutation({
    mutationFn: async () => {
      if (newPwd !== confirmPwd) throw new Error('New passwords do not match.');
      await api.patch('/v1/partners/me/password', {
        currentPassword: currentPwd,
        newPassword:     newPwd,
      });
    },
    onSuccess: () => {
      setPwdSuccess(true);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setPwdSuccess(false), 4000);
    },
    onError: (err) => setPwdError(getErrorMessage(err)),
  });

  const selfSuspendMutation = useMutation({
    mutationFn: async () => { await api.patch('/v1/partners/me/suspend'); },
    onSuccess:  async () => { await signOut({ callbackUrl: '/login?reason=suspended' }); },
    onError:    (err) => setSuspendError(getErrorMessage(err)),
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Manage your partner account and integration details</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />Settings saved successfully
        </div>
      )}

      <form onSubmit={handleSave} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />Company Information
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Company Name</label>
            <input type="text" defaultValue={session?.user?.name ?? ''} className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Contact Email</label>
            <input type="email" defaultValue={session?.user?.email ?? ''} className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Country</label>
            <select className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="GB">United Kingdom 🇬🇧</option><option value="US">United States 🇺🇸</option>
              <option value="CA">Canada 🇨🇦</option><option value="NG">Nigeria 🇳🇬</option>
            </select></div>
          <div><label className="block text-sm font-medium text-foreground mb-1.5">Website</label>
            <input type="url" className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
        </div>
        <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />Integration Details
        </h2>
        <div className="space-y-3">
          {[
            { label: 'Partner ID',       value: (session?.user as { id?: string } | undefined)?.id ?? 'N/A' },
            { label: 'API Base URL',     value: 'https://api.elorge.com' },
            { label: 'Sandbox Base URL', value: 'https://sandbox.elorge.com' },
            { label: 'API Version',      value: 'v1' },
            { label: 'Auth Method',      value: 'Bearer token (Authorization header)' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">{label}</span>
              <code className="text-sm font-mono text-foreground">{value}</code>
            </div>
          ))}
        </div>
        <a href="http://localhost:3001/api/docs" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors">
          <Globe className="h-4 w-4" />Open API Documentation
        </a>
      </div>

      {/* ── Password change ─────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />Change Password
        </h2>
        {pwdSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />Password changed successfully.
          </div>
        )}
        {pwdError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{pwdError}</div>
        )}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Current Password</label>
            <div className="relative">
              <input type={showCur ? 'text' : 'password'} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={() => setShowCur((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="At least 8 characters"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
              className={cn('w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring',
                confirmPwd && newPwd !== confirmPwd ? 'border-destructive' : 'border-input')} />
            {confirmPwd && newPwd !== confirmPwd && <p className="mt-1 text-xs text-destructive">Passwords do not match.</p>}
          </div>
        </div>
        <button onClick={() => { setPwdError(''); changePwdMutation.mutate(); }}
          disabled={changePwdMutation.isPending || !currentPwd || !newPwd || !confirmPwd || newPwd !== confirmPwd || newPwd.length < 8}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {changePwdMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {changePwdMutation.isPending ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />Security
        </h2>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">IP Allowlist (coming soon)</label>
          <input type="text" disabled placeholder="e.g. 1.2.3.4, 5.6.7.8"
            className="w-full rounded-lg border border-input bg-muted px-3.5 py-2.5 text-sm text-muted-foreground cursor-not-allowed" />
          <p className="mt-1 text-xs text-muted-foreground">Contact support to enable.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <h2 className="text-base font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Suspending your account stops all API access immediately. Email{' '}
          <a href="mailto:support@elorge.com" className="underline text-foreground">support@elorge.com</a>
          {' '}to reactivate — only Elorge admins can do this.
        </p>
        <button onClick={() => { setShowSuspendConfirm(true); setSuspendError(''); }}
          className="rounded-lg border border-destructive/50 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
          Suspend My Account
        </button>
      </div>

      {showSuspendConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="mt-4 text-center text-base font-semibold text-foreground">Suspend Your Account?</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              All API access stops immediately. Email <strong>support@elorge.com</strong> to reactivate.
            </p>
            {suspendError && <p className="mt-3 text-center text-xs text-destructive">{suspendError}</p>}
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowSuspendConfirm(false)} disabled={selfSuspendMutation.isPending}
                className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={() => selfSuspendMutation.mutate()} disabled={selfSuspendMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors">
                {selfSuspendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Yes, Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}