'use client';

// apps/dashboard/src/components/layout/Sidebar.tsx
import Link            from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession }  from 'next-auth/react';
import {
  LayoutDashboard, ArrowRightLeft, Key,
  Webhook, Settings, ChevronLeft,
  Users, AlertTriangle, ShieldCheck, MessageSquare,
} from 'lucide-react';

import { useDashboardStore }  from '@/store/dashboard.store';
import { useNotifications }   from '@/hooks/useNotifications';
import { cn }                 from '@/lib/utils';

const PARTNER_NAV = [
  { href: '/',             label: 'Overview',     icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft  },
  { href: '/api-keys',     label: 'API Keys',     icon: Key             },
  { href: '/webhooks',     label: 'Webhooks',     icon: Webhook         },
  { href: '/settings',     label: 'Settings',     icon: Settings        },
];

const ADMIN_NAV = [
  { href: '/admin',              label: 'Platform Overview', icon: ShieldCheck    },
  { href: '/admin/partners',     label: 'All Partners',      icon: Users          },
  { href: '/admin/transactions', label: 'All Transactions',  icon: ArrowRightLeft },
  { href: '/admin/flagged',      label: 'Flagged Queue',     icon: AlertTriangle  },
  { href: '/admin/messages',     label: 'Messages',          icon: MessageSquare  },
  { href: '/admin/pending',      label: 'Pending Review',    icon: Clock          },
  { href: '/admin/settings',     label: 'Admin Settings',    icon: Settings       },
];

export function Sidebar() {
  const pathname                       = usePathname();
  const { data: session }              = useSession();
  const { sidebarOpen, toggleSidebar } = useDashboardStore();
  const { data: notifData }            = useNotifications();

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';

  // Count unread SYSTEM notifications (partner interest submissions) for inbox badge
  const inboxUnread = (notifData?.notifications ?? []).filter(
    (n) => n.type === 'SYSTEM' && !n.read,
  ).length;

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  function NavItem({
    href, label, icon: Icon, badge,
  }: {
    href:   string;
    label:  string;
    icon:   React.ElementType;
    badge?: number;
  }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
          active
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
        title={!sidebarOpen ? label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {sidebarOpen && <span className="truncate flex-1">{label}</span>}
        {sidebarOpen && badge && badge > 0 && (
          <span className={cn(
            'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold',
            active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary text-primary-foreground',
          )}>
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </Link>
    );
  }

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300',
      sidebarOpen ? 'w-60' : 'w-16',
    )}>
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            E
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Elorge</p>
              <p className="truncate text-[10px] text-muted-foreground">
                {isAdmin ? 'Admin Console' : 'Payout Platform'}
              </p>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <button onClick={toggleSidebar} className="ml-auto rounded-lg p-1 hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 pt-4 overflow-y-auto h-[calc(100vh-4rem-4rem)]">
        {PARTNER_NAV.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {isAdmin && (
          <>
            <div className={cn('my-2', sidebarOpen ? 'border-t border-border pt-2' : 'flex justify-center')}>
              {sidebarOpen && (
                <p className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Admin
                </p>
              )}
            </div>
            {ADMIN_NAV.map((item) => (
              <NavItem
                key={item.href}
                {...item}
                badge={item.href === '/admin/messages' ? inboxUnread : undefined}
              />
            ))}
          </>
        )}
      </nav>

      {/* Status dot */}
      <div className={cn('absolute bottom-4 left-0 right-0 px-3', !sidebarOpen && 'flex justify-center')}>
        <div className={cn(
          'flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2',
          !sidebarOpen && 'justify-center px-0 py-2 bg-transparent border-transparent',
        )}>
          <div className="h-2 w-2 shrink-0 rounded-full bg-green-500 animate-pulse" />
          {sidebarOpen && <span className="text-xs text-green-700 font-medium">All systems operational</span>}
        </div>
      </div>
    </aside>
  );
}