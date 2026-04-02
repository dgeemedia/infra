// apps/dashboard/src/app/(dashboard)/page.tsx
import { getServerSession } from 'next-auth/next';  
import { authOptions }      from '@/lib/auth';
import { OverviewClient }   from './overview-client';

export const metadata = { title: 'Overview — Elorge Dashboard' };

export default async function OverviewPage() {
  const session   = await getServerSession(authOptions);
  const partnerId = session?.user?.id ?? '';
  return <OverviewClient partnerId={partnerId} />;
}