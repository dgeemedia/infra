'use client';

import Link                         from 'next/link';
import { usePathname }              from 'next/navigation';
import {
  LayoutDashboard, ArrowRightLeft, Key,
  Webhook, Settings, ChevronLeft, Zap,
} from 'lucide-react';

import { useDashboardStore }        from '@/store/dashboard.store';
import { cn }                       from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/',              label: 'Overview',     icon: LayoutDashboard },
  { href: '/transactions',  label: 'Transactions', icon: ArrowRightLeft   },
  { href: '/api-keys',      label: 'API Keys',     icon: Key              },
  { href: '/webhooks',      label: 'Webhooks',     icon: Webhook          },
  { href: '/settings',      label: 'Settings',     icon: Settings         },
];

export function Sidebar() {
  const pathname              = usePathname();
  const { sidebarOpen, toggleSidebar } = useDashboardStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      {/* ── Logo ────────────────────────────────────────── */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            E
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Elorge</p>
              <p className="truncate text-[10px] text-muted-foreground">Payout Platform</p>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="ml-auto rounded-lg p-1 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="flex flex-col gap-1 p-2 pt-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title={!sidebarOpen ? label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Status dot ──────────────────────────────────── */}
      <div className={cn(
        'absolute bottom-4 left-0 right-0 px-3',
        !sidebarOpen && 'flex justify-center',
      )}>
        <div className={cn(
          'flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2',
          !sidebarOpen && 'justify-center px-0 py-2 bg-transparent border-transparent',
        )}>
          <div className="h-2 w-2 shrink-0 rounded-full bg-green-500 animate-pulse" />
          {sidebarOpen && (
            <span className="text-xs text-green-700 font-medium">All systems operational</span>
          )}
        </div>
      </div>
    </aside>
  );
}
