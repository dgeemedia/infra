'use client';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

import { useVolumeData }  from '@/hooks/usePayoutStats';
import { formatNaira }    from '@/lib/utils';

export function VolumeChart() {
  const { data, isLoading } = useVolumeData(30);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#1250A0" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#1250A0" stopOpacity={0}    />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => format(new Date(v), 'dd MMM')}
          tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v: number) => `₦${(v / 1_000_000).toFixed(1)}M`}
          tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }}
          axisLine={false}
          tickLine={false}
          width={60}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload as { volume: number; count: number; successRate: number };
            return (
              <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-sm">
                <p className="font-medium text-foreground mb-1">
                  {format(new Date(label as string), 'dd MMM yyyy')}
                </p>
                <p className="text-muted-foreground">Volume: <span className="text-foreground font-medium">{formatNaira(d.volume)}</span></p>
                <p className="text-muted-foreground">Payouts: <span className="text-foreground font-medium">{d.count}</span></p>
                <p className="text-muted-foreground">Success: <span className="text-green-600 font-medium">{d.successRate}%</span></p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="volume"
          stroke="#1250A0"
          strokeWidth={2}
          fill="url(#volumeGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#1250A0', stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
