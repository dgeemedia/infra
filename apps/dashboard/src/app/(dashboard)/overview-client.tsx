'use client';

import {
  ArrowUpRight, CheckCircle2, XCircle,
  Clock, TrendingUp, Zap,
} from 'lucide-react';

import { usePayoutStats }    from '@/hooks/usePayoutStats';
import { useTransactions }   from '@/hooks/useTransactions';
import { VolumeChart }       from '@/components/charts/VolumeChart';
import { SuccessRateChart }  from '@/components/charts/SuccessRateChart';
import { StatusBadge }       from '@/components/transactions/StatusBadge';
import {
  formatNaira, formatPercent, formatNumber, timeAgo, cn,
} from '@/lib/utils';

// ── Stat card ──────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, trend, color = 'blue',
}: {
  label:  string;
  value:  string;
  sub?:   string;
  icon:   React.ElementType;
  trend?: string;
  color?: 'blue' | 'green' | 'red' | 'amber';
}) {
  const colorMap = {
    blue:  'bg-blue-50  text-blue-600  border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    red:   'bg-red-50   text-red-600   border-red-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className={cn('rounded-xl border p-2.5', colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────
export function OverviewClient({ partnerId }: { partnerId: string }) {
  const { data: stats, isLoading: statsLoading }     = usePayoutStats(partnerId);
  const { data: recent, isLoading: recentLoading }   = useTransactions({ page: 1, pageSize: 5 });

  return (
    <div className="space-y-6">

      {/* ── Page heading ────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your payout platform at a glance
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Payouts"
          value={statsLoading ? '—' : formatNumber(stats?.totalPayouts ?? 0)}
          sub="All time"
          icon={Zap}
          color="blue"
        />
        <StatCard
          label="Delivered"
          value={statsLoading ? '—' : formatNumber(stats?.successfulPayouts ?? 0)}
          sub="Successfully credited"
          icon={CheckCircle2}
          color="green"
          trend={statsLoading ? undefined : `${formatPercent(stats?.successRate ?? 0)} rate`}
        />
        <StatCard
          label="Failed"
          value={statsLoading ? '—' : formatNumber(stats?.failedPayouts ?? 0)}
          sub="Requires attention"
          icon={XCircle}
          color="red"
        />
        <StatCard
          label="Today"
          value={statsLoading ? '—' : formatNumber(stats?.todayPayouts ?? 0)}
          sub="Payouts initiated today"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* ── Charts row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Volume chart — takes 2/3 */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Payout Volume</h2>
              <p className="text-xs text-muted-foreground">Naira volume over last 30 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <VolumeChart />
        </div>

        {/* Success rate — takes 1/3 */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Success Rate</h2>
            <p className="text-xs text-muted-foreground">Daily delivery rate — last 14 days</p>
          </div>
          <SuccessRateChart />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-green-600" /> ≥90%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> 70–90%
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-sm bg-red-600" /> &lt;70%
            </span>
          </div>
        </div>
      </div>

      {/* ── Recent transactions ──────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Recent Payouts</h2>
          <a
            href="/transactions"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all →
          </a>
        </div>

        <div className="divide-y divide-border">
          {recentLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                <div className="ml-auto h-4 w-24 rounded bg-muted animate-pulse" />
              </div>
            ))}

          {!recentLoading && recent?.data.map((payout) => (
            <div
              key={payout.payoutId}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {payout.partnerReference}
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo(payout.createdAt)}</p>
              </div>
              <StatusBadge status={payout.status} />
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">
                  {formatNaira(Number(payout.nairaAmount))}
                </p>
              </div>
            </div>
          ))}

          {!recentLoading && (!recent?.data || recent.data.length === 0) && (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              No payouts yet. Your first transaction will appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
