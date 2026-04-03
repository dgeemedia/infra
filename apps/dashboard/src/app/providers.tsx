// apps/dashboard/src/app/providers.tsx
'use client';

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}