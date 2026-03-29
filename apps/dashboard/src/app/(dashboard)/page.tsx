import { getServerSession }  from 'next-auth';
import { authOptions }       from '@/lib/auth';
import { OverviewClient }    from './overview-client';

export const metadata = { title: 'Overview — Elorge Dashboard' };

export default async function OverviewPage() {
  const session = await getServerSession(authOptions);
  const partnerId = (session?.user as { id?: string } | undefined)?.id ?? '';
  return <OverviewClient partnerId={partnerId} />;
}
