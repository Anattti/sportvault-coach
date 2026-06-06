'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComplianceWeek } from '@/types';
import { Flame } from 'lucide-react';

interface ComplianceChartProps {
  history: ComplianceWeek[];
  trainingStreakWeeks: number;
  programStuck: boolean;
}

export default function ComplianceChart({
  history,
  trainingStreakWeeks,
  programStuck,
}: ComplianceChartProps) {
  const chartData = history.map((w) => ({
    label: w.label,
    suunniteltu: w.planned,
    tehty: w.completed,
    compliance: w.compliancePercent,
  }));

  return (
    <Card className="glass-panel border-white/8">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Noudattaminen</CardTitle>
            <CardDescription>Suunniteltu vs tehty viikoittain</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            {trainingStreakWeeks > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                <Flame className="h-3 w-3" />
                {trainingStreakWeeks} vk putki
              </span>
            )}
            {programStuck && (
              <span className="text-xs font-medium text-destructive">Ohjelma jumissa</span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[240px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
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
              <Bar dataKey="suunniteltu" name="Suunniteltu" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tehty" name="Tehty" fill="rgba(0,255,65,0.6)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
