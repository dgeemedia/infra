'use client';

// apps/dashboard/src/components/layout/Navbar.tsx
import { useState, useRef, useEffect } from 'react';
import { signOut, useSession }         from 'next-auth/react';
import { Bell, LogOut, Menu, User, Settings, ChevronDown, X, Loader2 } from 'lucide-react';
import { useDashboardStore }           from '@/store/dashboard.store';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications';
import { cn, timeAgo } from '@/lib/utils';

// Coloured dot per notification type
const TYPE_DOT: Record<string, string> = {
  PAYOUT_DELIVERED:  'bg-green-500',
  PAYOUT_FAILED:     'bg-red-500',
  PAYOUT_FLAGGED:    'bg-amber-500',
  WEBHOOK_FAILED:    'bg-orange-500',
  API_KEY_CREATED:   'bg-blue-500',
  ACCOUNT_SUSPENDED: 'bg-red-700',
  SYSTEM:            'bg-muted-foreground',
};

export function Navbar() {
  const { data: session }              = useSession();
  const { sidebarOpen, toggleSidebar } = useDashboardStore();

  const [bellOpen,    setBellOpen]    = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const bellRef    = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // ── Real notification data ─────────────────────────────────────────
  const { data: notifData, isLoading: notifLoading } = useNotifications();
  const markRead    = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notifData?.notifications ?? [];
  const unreadCount   = notifData?.unreadCount   ?? 0;

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (bellRef.current    && !bellRef.current.contains(e.target as Node))    setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const userName  = session?.user?.name  ?? 'Partner';
  const userEmail = session?.user?.email ?? '';
  const isAdmin   = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-card/95 backdrop-blur px-4 gap-3">

      {/* Sidebar toggle (when collapsed) */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">

        {/* ── Notification bell ──────────────────────────────────────── */}
        <div ref={bellRef} className="relative">
          <button
            onClick={() => { setBellOpen((v) => !v); setProfileOpen(false); }}
            className="relative rounded-lg p-2 hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllRead.mutate()}
                      disabled={markAllRead.isPending}
                      className="text-xs text-primary hover:underline disabled:opacity-50"
                    >
                      Mark all read
                    </button>
                  )}
                  <button onClick={() => setBellOpen(false)}>
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="max-h-80 overflow-y-auto divide-y divide-border">
                {notifLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!notifLoading && notifications.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    You're all caught up 🎉
                  </p>
                )}

                {!notifLoading && notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => { if (!n.read) markRead.mutate(n.id); }}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors',
                      !n.read && 'bg-primary/5',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        n.read
                          ? 'bg-muted-foreground/30'
                          : (TYPE_DOT[n.type] ?? 'bg-primary'),
                      )} />
                      <div className="min-w-0">
                        <p className={cn(
                          'text-sm text-foreground',
                          !n.read && 'font-medium',
                        )}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {timeAgo(n.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Profile dropdown ───────────────────────────────────────── */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen((v) => !v); setBellOpen(false); }}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 hover:bg-muted transition-colors"
            aria-label="Profile menu"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-3.5 w-3.5" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
              {userName}
            </span>
            <ChevronDown className={cn(
              'hidden sm:block h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
              profileOpen && 'rotate-180',
            )} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                {isAdmin && (
                  <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Admin
                  </span>
                )}
              </div>
              <div className="p-1">
                <a
                  href="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Settings
                </a>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}