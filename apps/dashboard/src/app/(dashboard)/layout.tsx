// apps/dashboard/src/app/(dashboard)/layout.tsx
import { redirect }         from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions }      from '@/lib/auth';
import { Sidebar }          from '@/components/layout/Sidebar';
import { Navbar }           from '@/components/layout/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      {/* On mobile the sidebar is an overlay, so no left padding.
          On desktop (lg+) it's always visible at w-60. */}
      <div className="flex flex-1 flex-col min-w-0 lg:pl-60 transition-all duration-300">
        <Navbar />
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}