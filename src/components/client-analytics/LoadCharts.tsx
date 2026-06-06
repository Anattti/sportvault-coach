'use client';

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadMetrics } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface LoadChartsProps {
  load: LoadMetrics;
}

export default function LoadCharts({ load }: LoadChartsProps) {
  const combinedData = load.weeklyVolume.map((vol, i) => ({
    label: vol.label,
    volume: vol.value,
    sessions: load.weeklySessions[i]?.value ?? 0,
    isCurrentWeek: vol.isCurrentWeek,
  }));

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-white/8">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Kuormitus</CardTitle>
              <CardDescription>Volyymi ja treenimäärä viikoittain</CardDescription>
            </div>
            {load.acwr != null && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">ACWR</p>
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    load.acwrWarning ? 'text-destructive' : 'text-foreground'
                  }`}
                >
                  {load.acwr}
                </p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {load.acwrWarning && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive ring-1 ring-destructive/20">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Kuormitus korkea (ACWR &gt; 1,5) — tarkista palautuminen ja RPE.
            </div>
          )}
          <div className="h-[280px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={combinedData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="volume"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <YAxis
                  yAxisId="sessions"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  name="Volyymi (kg)"
                  fill="rgba(0,255,65,0.6)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="sessions"
                  type="monotone"
                  dataKey="sessions"
                  name="Treenit"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={{ fill: '#ffffff', r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
