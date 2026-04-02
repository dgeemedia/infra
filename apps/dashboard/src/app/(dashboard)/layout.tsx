// apps/dashboard/src/app/(dashboard)/layout.tsx
import { redirect }         from 'next/navigation';
import { getServerSession } from 'next-auth/next';   // ← next-auth/next explicitly
import { authOptions }      from '@/lib/auth';
import { Sidebar }          from '@/components/layout/Sidebar';
import { Navbar }           from '@/components/layout/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  console.log('[LAYOUT] session:', JSON.stringify(session));  // ← temporary

  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col transition-all duration-300 pl-60">
        <Navbar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}