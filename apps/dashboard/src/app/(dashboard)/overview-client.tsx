'use client';

// apps/dashboard/src/app/(dashboard)/overview-client.tsx
import { useSession }     from 'next-auth/react';
import {
  ArrowUpRight, CheckCircle2, XCircle, Clock,
  TrendingUp, Zap, ShieldCheck, AlertTriangle,
  DollarSign, Users, Wallet,
  ArrowUpRight as ArrowUp, ArrowDownLeft, RefreshCw,
} from 'lucide-react';

import { usePayoutStats }    from '@/hooks/usePayoutStats';
import { useAdminStats, useAdminBalances }     from '@/hooks/useAdmin';
import { usePartnerBalance } from '@/hooks/usePartnerBalance';
import { useTransactions }   from '@/hooks/useTransactions';
import { VolumeChart }       from '@/components/charts/VolumeChart';
import { SuccessRateChart }  from '@/components/charts/SuccessRateChart';
import { StatusBadge }       from '@/components/transactions/StatusBadge';
import {
  formatNaira, formatPercent, formatNumber, timeAgo, cn,
} from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────
function formatNgn(n: string | number) {
  const val = typeof n === 'string' ? parseFloat(n) : n;
  return new Intl.NumberFormat('en-NG', {
    style:                 'currency',
    currency:              'NGN',
    maximumFractionDigits: 0,
  }).format(val);
}

// ── Ledger entry display maps ─────────────────────────────────
const typeIcon: Record<string, React.ElementType> = {
  CREDIT: ArrowDownLeft,
  DEBIT:  ArrowUp,
  REFUND: RefreshCw,
};

const typeColor: Record<string, string> = {
  CREDIT: 'text-green-600',
  DEBIT:  'text-red-600',
  REFUND: 'text-amber-600',
};

const typeLabel: Record<string, string> = {
  CREDIT: 'Credit',
  DEBIT:  'Debit',
  REFUND: 'Refund',
};

// ── Shared StatCard ───────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, trend, color = 'blue',
}: {
  label:  string;
  value:  string;
  sub?:   string;
  icon:   React.ElementType;
  trend?: string;
  color?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'teal';
}) {
  const colorMap: Record<string, string> = {
    blue:   'bg-blue-50   text-blue-600   border-blue-100',
    green:  'bg-green-50  text-green-600  border-green-100',
    red:    'bg-red-50    text-red-600    border-red-100',
    amber:  'bg-amber-50  text-amber-600  border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    teal:   'bg-teal-50   text-teal-600   border-teal-100',
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

// ── Partner balance widget ────────────────────────────────────
function PartnerBalanceCard() {
  const { data, isLoading } = usePartnerBalance();

  const balanceNaira = data?.balanceNaira ?? '0.00';
  const funding      = data?.fundingAccount;
  const ledger       = data?.recentLedger ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">

      {/* Balance header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-1">
          <Wallet className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Naira wallet
          </span>
        </div>
        {isLoading
          ? <div className="h-9 w-40 rounded-lg bg-muted animate-pulse mt-1" />
          : <p className="text-3xl font-bold text-foreground">
              ₦{Number(balanceNaira).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
        }
        <p className="mt-1 text-xs text-muted-foreground">
          Prepaid balance — deducted on every payout
        </p>
      </div>

      {/* VAN funding instructions */}
      {funding && (
        <div className="p-5 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Fund your wallet — wire NGN to this account
          </p>
          {[
            { label: 'Bank',           value: funding.bankName      },
            { label: 'Account number', value: funding.accountNumber },
            { label: 'Account name',   value: funding.accountName   },
            { label: 'Reference',      value: funding.reference     },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-xs text-muted-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-foreground">{value}</code>
                <button onClick={() => navigator.clipboard.writeText(value)}
                  className="text-xs text-muted-foreground hover:text-foreground">
                  copy
                </button>
              </div>
            </div>
          ))}
          <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
            {funding.instructions[0]}
          </div>
        </div>
      )}

      {/* Recent ledger */}
      <div className="divide-y divide-border">
        <p className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent activity
        </p>

        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}

        {!isLoading && ledger.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-muted-foreground">
            No transactions yet. Contact support to top up.
          </p>
        )}

        {!isLoading && ledger.map((entry) => {
          const Icon  = typeIcon[entry.type]  ?? ArrowUp;
          const color = typeColor[entry.type] ?? 'text-muted-foreground';
          const label = typeLabel[entry.type] ?? entry.type;
          return (
            <div key={entry.id} className="flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
              <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{entry.description}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(entry.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn('text-sm font-medium', color)}>
                  {entry.type === 'DEBIT' ? '−' : '+'}{formatNgn(entry.amountNaira)}
                </p>
                <p className="text-xs text-muted-foreground">bal {formatNgn(entry.balanceAfterNaira)}</p>
              </div>
              <span className={cn(
                'shrink-0 self-center rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                entry.type === 'CREDIT' ? 'bg-green-100 text-green-700'
                : entry.type === 'REFUND' ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700',
              )}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Admin balances panel ──────────────────────────────────────
function AdminBalancesPanel() {
  const { data, isLoading } = useAdminBalances();
  const partners  = data?.partners           ?? [];
  const flw       = data?.flutterwaveBalance;
  const totalNaira = data?.totalNaira        ?? '₦0';

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Partner Balances
            </span>
          </div>
          {isLoading
            ? <div className="h-8 w-28 rounded bg-muted animate-pulse" />
            : <p className="text-2xl font-bold text-foreground">{totalNaira}</p>
          }
          <p className="mt-1 text-xs text-muted-foreground">Sum of all prefunded Naira wallets</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Flutterwave NGN Wallet
            </span>
          </div>
          {isLoading ? (
            <div className="h-8 w-28 rounded bg-muted animate-pulse" />
          ) : flw ? (
            <>
              <p className="text-2xl font-bold text-foreground">{formatNgn(flw.available)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Available · Ledger: {formatNgn(flw.ledger)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Not configured — add FLUTTERWAVE_SECRET_KEY to .env
            </p>
          )}
        </div>
      </div>

      {/* Per-partner balance table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border bg-muted/20 flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Partner Balances</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['Partner', 'Country', 'Status', 'Balance (NGN)', 'Last Top-up', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {!isLoading && partners.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.country}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      p.status === 'ACTIVE'           ? 'bg-green-100 text-green-700'
                      : p.status === 'PENDING_REVIEW' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700',
                    )}>
                      {p.status === 'PENDING_REVIEW' ? 'Pending' : p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'font-semibold tabular-nums',
                      p.balanceKobo <= 0 ? 'text-red-600' : 'text-foreground',
                    )}>
                      {p.balanceNaira}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {p.lastTopUp
                      ? timeAgo(p.lastTopUp.createdAt)
                      : <span className="italic">Never</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/admin/partners/${p.id}`}
                      className="rounded-lg px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              ))}

              {!isLoading && partners.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No partners yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Admin overview ────────────────────────────────────────────
function AdminOverview() {
  const { data: stats, isLoading } = useAdminStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">Real-time stats across all partners and payouts</p>
        </div>
      </div>

      {/* Partners */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Partners</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Partners"  value={isLoading ? '—' : formatNumber(stats?.totalPartners  ?? 0)} sub="All registered" icon={Users}       color="blue"  />
          <StatCard label="Active Partners" value={isLoading ? '—' : formatNumber(stats?.activePartners ?? 0)}                     icon={CheckCircle2}  color="green" />
          <StatCard label="Suspended"       value={isLoading ? '—' : formatNumber((stats?.totalPartners ?? 0) - (stats?.activePartners ?? 0))} icon={XCircle} color="red" />
        </div>
      </div>

      {/* Payouts */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payouts</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Payouts" value={isLoading ? '—' : formatNumber(stats?.totalPayouts     ?? 0)} sub="All time"     icon={Zap}           color="blue"  />
          <StatCard label="Delivered"     value={isLoading ? '—' : formatNumber(stats?.deliveredPayouts ?? 0)} trend={isLoading ? undefined : `${formatPercent(stats?.successRate ?? 0)} rate`} icon={CheckCircle2} color="green" />
          <StatCard label="Failed"        value={isLoading ? '—' : formatNumber(stats?.failedPayouts    ?? 0)}                    icon={XCircle}       color="red"   />
          <StatCard label="Flagged"       value={isLoading ? '—' : formatNumber(stats?.flaggedPayouts   ?? 0)} sub="Needs review" icon={AlertTriangle}  color="amber" />
        </div>
      </div>

      {/* Financials */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Financials</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Total Volume Delivered" value={isLoading ? '—' : formatNaira(stats?.totalVolumeKobo   ?? 0)} sub="Naira credited to recipients" icon={TrendingUp}  color="green"  />
          <StatCard label="Total Fees Collected"   value={isLoading ? '—' : formatNaira(stats?.totalFeesKobo ?? 0)} sub="Platform revenue"             icon={DollarSign} color="purple" />
        </div>
      </div>

      {/* Balances */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Balances</p>
        <AdminBalancesPanel />
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { href: '/admin/partners',     label: 'Manage Partners'   },
            { href: '/admin/transactions', label: 'View Transactions'  },
            { href: '/admin/flagged',      label: `Review Flagged (${stats?.flaggedPayouts ?? 0})` },
            { href: '/admin/settings',     label: 'Receiving Account'  },
          ].map(({ href, label }) => (
            <a key={href} href={href}
              className="rounded-lg border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Partner overview ──────────────────────────────────────────
function PartnerOverview({ partnerId }: { partnerId: string }) {
  const { data: stats,  isLoading: statsLoading  } = usePayoutStats(partnerId);
  const { data: recent, isLoading: recentLoading } = useTransactions({ page: 1, pageSize: 5 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your payout platform at a glance</p>
      </div>

      {/* Balance — always first thing a partner sees */}
      <PartnerBalanceCard />

      {/* Payout stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Payouts" value={statsLoading ? '—' : formatNumber(stats?.totalPayouts      ?? 0)} sub="All time"              icon={Zap}          color="blue"  />
        <StatCard label="Delivered"     value={statsLoading ? '—' : formatNumber(stats?.successfulPayouts ?? 0)} sub="Successfully credited"  icon={CheckCircle2} color="green" trend={statsLoading ? undefined : `${formatPercent(stats?.successRate ?? 0)} rate`} />
        <StatCard label="Failed"        value={statsLoading ? '—' : formatNumber(stats?.failedPayouts     ?? 0)} sub="Requires attention"     icon={XCircle}      color="red"   />
        <StatCard label="Today"         value={statsLoading ? '—' : formatNumber(stats?.todayPayouts      ?? 0)} sub="Payouts initiated today" icon={Clock}        color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
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
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-foreground">Success Rate</h2>
            <p className="text-xs text-muted-foreground">Daily delivery rate — last 14 days</p>
          </div>
          <SuccessRateChart />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-green-600" /> ≥90%</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-500" /> 70–90%</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-red-600"   /> &lt;70%</span>
          </div>
        </div>
      </div>

      {/* Recent payouts */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Recent Payouts</h2>
          <a href="/transactions" className="text-xs font-medium text-primary hover:underline">View all →</a>
        </div>
        <div className="divide-y divide-border">
          {recentLoading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="ml-auto h-4 w-24 rounded bg-muted animate-pulse" />
            </div>
          ))}
          {!recentLoading && recent?.data.map((payout) => (
            <div key={payout.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{payout.partnerReference}</p>
                <p className="text-xs text-muted-foreground">{timeAgo(payout.createdAt)}</p>
              </div>
              <StatusBadge status={payout.status} />
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{formatNaira(payout.nairaAmountKobo / 100)}</p>
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

// ── Root export ───────────────────────────────────────────────
export function OverviewClient({ partnerId }: { partnerId: string }) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';
  if (isAdmin) return <AdminOverview />;
  return <PartnerOverview partnerId={partnerId} />;
}