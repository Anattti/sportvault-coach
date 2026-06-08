'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface E1RMDataPoint {
  date: string;
  value: number;
}

interface E1RMChartProps {
  exerciseName: string;
  data: E1RMDataPoint[];
}

export default function E1RMChart({ exerciseName, data }: E1RMChartProps) {
  // Muotoile päivämäärät selkeämpään muotoon X-akselille
  const formattedData = data.map(d => ({
    ...d,
    displayDate: format(new Date(d.date), 'd.M.'),
  }));

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle>Arvioitu Ykkösmaksimi (e1RM)</CardTitle>
        <CardDescription>{exerciseName}</CardDescription>
      </CardHeader>
      <CardContent>
        {formattedData.length < 2 ? (
          <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground text-sm">
            Ei tarpeeksi dataa kaavion piirtämiseen. (Vähintään 2 treeniä vaaditaan)
          </div>
        ) : (
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="displayDate" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  domain={['auto', 'auto']}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#00f3ff', fontWeight: 'bold' }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00f3ff" 
                  strokeWidth={3}
                  dot={{ fill: '#00f3ff', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#00FF41', stroke: 'none' }}
                  name="e1RM (kg)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
