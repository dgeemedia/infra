'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { format } from 'date-fns';

import { useVolumeData } from '@/hooks/usePayoutStats';

export function SuccessRateChart() {
  const { data, isLoading } = useVolumeData(14);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => format(new Date(v), 'dd MMM')}
          tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: 'hsl(215 16% 47%)' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const rate = payload[0]?.value as number;
            return (
              <div className="rounded-xl border border-border bg-card p-3 shadow-lg text-sm">
                <p className="font-medium mb-1">{format(new Date(label as string), 'dd MMM yyyy')}</p>
                <p className="text-muted-foreground">
                  Success rate: <span className={`font-medium ${rate >= 90 ? 'text-green-600' : rate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{rate}%</span>
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="successRate" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data?.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.successRate >= 90 ? '#1A6E2E' :
                entry.successRate >= 70 ? '#C97D10' : '#dc2626'
              }
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
