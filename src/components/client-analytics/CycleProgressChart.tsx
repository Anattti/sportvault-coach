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
import { CycleProgressPoint } from '@/types';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';

interface CycleProgressChartProps {
  data: CycleProgressPoint[];
}

export default function CycleProgressChart({ data }: CycleProgressChartProps) {
  const chartData = data.map((p) => ({
    displayDate: format(new Date(p.date), 'd.M.', { locale: fi }),
    cycleWeek: p.cycleWeek,
    programStuck: p.programStuck,
  }));

  return (
    <Card className="glass-panel border-white/8">
      <CardHeader>
        <CardTitle>Jakson eteneminen</CardTitle>
        <CardDescription>Ohjelman viikko treenien aikajärjestyksessä</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length < 2 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Ei tarpeeksi dataa jakson seurantaan.
          </div>
        ) : (
          <div className="h-[200px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="displayDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <YAxis
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
                <Line
                  type="stepAfter"
                  dataKey="cycleWeek"
                  name="Viikko"
                  stroke="rgba(0,255,65,0.8)"
                  strokeWidth={2}
                  dot={{ fill: 'rgba(0,255,65,0.8)', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
