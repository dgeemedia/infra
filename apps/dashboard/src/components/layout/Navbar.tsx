// apps/dashboard/src/components/layout/Navbar.tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import { Bell, LogOut, Menu, User }  from 'lucide-react';
import { useDashboardStore }         from '@/store/dashboard.store';
import { cn }                        from '@/lib/utils';

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  const { data: session }              = useSession();
  const { sidebarOpen, toggleSidebar } = useDashboardStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border bg-card/95 backdrop-blur px-4 gap-3">
      {/* Collapse / expand sidebar */}
      {!sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 hover:bg-muted transition-colors"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
      )}

      {/* Page title */}
      {title && (
        <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button className="relative rounded-lg p-2 hover:bg-muted transition-colors">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </button>

        {/* Partner name */}
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {session?.user?.name ?? 'Partner'}
          </span>
        </div>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
