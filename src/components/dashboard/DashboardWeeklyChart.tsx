'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { WeeklyMetricPoint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type WeeklyChartVariant = 'volume' | 'sessions';

interface DashboardWeeklyChartProps {
  variant: WeeklyChartVariant;
  data: WeeklyMetricPoint[];
}

const CHART_CONFIG = {
  volume: {
    title: 'Viikottainen volyymi',
    description: 'Kokonaiskuorma kaikilta asiakkailta, viimeiset 8 viikkoa',
    tooltipLabel: 'Volyymi',
    emptyTitle: 'Ei volyymidataa vielä',
    emptyDescription: 'Kaavio täyttyy, kun asiakkaasi suorittavat treenejä.',
  },
  sessions: {
    title: 'Treenimäärä viikoittain',
    description: 'Suoritettujen treenien määrä, viimeiset 8 viikkoa',
    tooltipLabel: 'Treenit',
    emptyTitle: 'Ei treenidataa vielä',
    emptyDescription: 'Kaavio täyttyy treenien myötä.',
  },
} as const;

function formatValue(value: number, variant: WeeklyChartVariant): string {
  if (variant === 'sessions') return `${value} treeniä`;
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString('fi-FI', { maximumFractionDigits: 1 })} t`;
  }
  return `${value.toLocaleString('fi-FI')} kg`;
}

function formatYAxis(value: number, variant: WeeklyChartVariant): string {
  if (variant === 'sessions') return `${value}`;
  return value >= 1000 ? `${(value / 1000).toFixed(0)}t` : `${value}`;
}

function getWeekTrend(data: WeeklyMetricPoint[]): {
  percent: number;
  direction: 'up' | 'down' | 'neutral';
} {
  if (data.length < 2) return { percent: 0, direction: 'neutral' };

  const current = data[data.length - 1]?.value ?? 0;
  const previous = data[data.length - 2]?.value ?? 0;

  if (previous === 0) {
    return current > 0
      ? { percent: 100, direction: 'up' }
      : { percent: 0, direction: 'neutral' };
  }

  const percent = Math.round(((current - previous) / previous) * 100);
  return {
    percent: Math.abs(percent),
    direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral',
  };
}

export default function DashboardWeeklyChart({ variant, data }: DashboardWeeklyChartProps) {
  const config = CHART_CONFIG[variant];
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const trend = getWeekTrend(data);
  const hasData = total > 0;

  const TrendIcon =
    trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;

  return (
    <Card className="bg-card/50 border-border ring-1 ring-white/5 h-full">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div>
          <CardTitle className="text-base font-semibold">{config.title}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{config.description}</p>
        </div>
        {hasData && (
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 shrink-0',
              trend.direction === 'up' && 'bg-primary/10 text-primary ring-primary/20',
              trend.direction === 'down' && 'bg-destructive/10 text-destructive ring-destructive/20',
              trend.direction === 'neutral' && 'bg-muted text-muted-foreground ring-white/10',
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" />
            {trend.direction === 'neutral'
              ? 'Ei muutosta'
              : `${trend.percent} % edelliseen vk`}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[220px] flex-col items-center justify-center text-center text-muted-foreground">
            <p className="text-sm font-medium text-foreground/70">{config.emptyTitle}</p>
            <p className="mt-1 max-w-xs text-xs">{config.emptyDescription}</p>
          </div>
        ) : (
          <div className="h-[220px] w-full min-w-0 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
                  tickFormatter={(v) => formatYAxis(Number(v), variant)}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{
                    backgroundColor: '#141414',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}
                  formatter={(value) => [
                    formatValue(Number(value), variant),
                    config.tooltipLabel,
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                  {data.map((entry) => (
                    <Cell
                      key={entry.label}
                      fill={entry.isCurrentWeek ? '#00FF41' : 'rgba(0, 255, 65, 0.35)'}
                      stroke={entry.isCurrentWeek ? 'rgba(0, 255, 65, 0.6)' : 'transparent'}
                      strokeWidth={entry.isCurrentWeek ? 1 : 0}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
