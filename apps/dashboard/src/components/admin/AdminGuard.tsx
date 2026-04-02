'use client';

// apps/dashboard/src/components/admin/AdminGuard.tsx
// Wrap any admin page with this to block non-admin users

import { useSession } from 'next-auth/react';
import { useRouter }  from 'next/navigation';
import { useEffect }  from 'react';
import { Loader2 }    from 'lucide-react';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
      router.replace('/');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || (session.user as { role?: string }).role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
}
