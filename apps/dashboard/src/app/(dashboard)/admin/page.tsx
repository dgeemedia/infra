'use client';

// apps/dashboard/src/app/(dashboard)/admin/page.tsx
import { AdminGuard }    from '@/components/admin/AdminGuard';
import { useAdminStats } from '@/hooks/useAdmin';
import {
  formatNaira, formatNumber, formatPercent, cn,
} from '@/lib/utils';
import {
  Users, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, DollarSign, ShieldCheck, Loader2,
} from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?:  string;
  icon:  React.ElementType;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple';
}

const COLOR_MAP: Record<StatCardProps['color'], string> = {
  blue:   'bg-blue-50   text-blue-600   border-blue-100',
  green:  'bg-green-50  text-green-600  border-green-100',
  red:    'bg-red-50    text-red-600    border-red-100',
  amber:  'bg-amber-50  text-amber-600  border-amber-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
};

function StatCard({ label, value, sub, icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className={cn('rounded-xl border p-2.5 w-fit mb-4', COLOR_MAP[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AdminOverviewContent() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">
            Real-time stats across all partners and payouts
          </p>
        </div>
      </div>

      {/* Partner stats */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Partners
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label="Total Partners"
            value={formatNumber(stats?.totalPartners ?? 0)}
            sub="All registered partners"
            icon={Users}
            color="blue"
          />
          <StatCard
            label="Active Partners"
            value={formatNumber(stats?.activePartners ?? 0)}
            sub="With ACTIVE status"
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            label="Suspended"
            value={formatNumber((stats?.totalPartners ?? 0) - (stats?.activePartners ?? 0))}
            sub="Inactive or suspended"
            icon={XCircle}
            color="red"
          />
        </div>
      </div>

      {/* Payout stats */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Payouts
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Payouts"
            value={formatNumber(stats?.totalPayouts ?? 0)}
            sub="All time"
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            label="Delivered"
            value={formatNumber(stats?.deliveredPayouts ?? 0)}
            sub={`${formatPercent(stats?.successRate ?? 0)} success rate`}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            label="Failed"
            value={formatNumber(stats?.failedPayouts ?? 0)}
            icon={XCircle}
            color="red"
          />
          <StatCard
            label="Flagged"
            value={formatNumber(stats?.flaggedPayouts ?? 0)}
            sub="Awaiting compliance review"
            icon={AlertTriangle}
            color="amber"
          />
        </div>
      </div>

      {/* Financial stats */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Financials
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            label="Total Volume Delivered"
            value={formatNaira(Number(stats?.totalVolumeNaira ?? 0))}
            sub="Naira credited to recipients"
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            label="Total Fees Collected"
            value={formatNaira(Number(stats?.totalFeesKobo ?? 0))}
            sub="Platform revenue"
            icon={DollarSign}
            color="purple"
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/admin/partners',     label: 'Manage Partners'   },
            { href: '/admin/transactions', label: 'View Transactions'  },
            { href: '/admin/flagged',      label: `Review Flagged (${stats?.flaggedPayouts ?? 0})` },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewPage() {
  return (
    <AdminGuard>
      <AdminOverviewContent />
    </AdminGuard>
  );
}