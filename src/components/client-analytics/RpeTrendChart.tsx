'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyMetricPoint } from '@/types';

interface RpeTrendChartProps {
  data: WeeklyMetricPoint[];
}

export default function RpeTrendChart({ data }: RpeTrendChartProps) {
  const chartData = data.filter((d) => d.value > 0);

  return (
    <Card className="glass-panel border-white/8">
      <CardHeader>
        <CardTitle>RPE-trendi</CardTitle>
        <CardDescription>Keskimääräinen koettu rasitus viikoittain</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            Ei tarpeeksi RPE-dataa kaavioon.
          </div>
        ) : (
          <div className="h-[220px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 10]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="RPE"
                  stroke="rgba(255,165,0,0.9)"
                  strokeWidth={2}
                  dot={{ fill: 'rgba(255,165,0,0.9)', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
