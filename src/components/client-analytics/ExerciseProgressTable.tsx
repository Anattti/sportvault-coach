import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { ExerciseProgressRow } from '@/types';
import { cn } from '@/lib/utils';

interface ExerciseProgressTableProps {
  exercises: ExerciseProgressRow[];
}

function TrendIcon({ trend }: { trend: ExerciseProgressRow['trend'] }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-primary" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

const trendLabel = {
  up: 'Nousussa',
  down: 'Laskussa',
  stable: 'Tasainen',
};

export default function ExerciseProgressTable({ exercises }: ExerciseProgressTableProps) {
  if (exercises.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground">
        <p>Ei tarpeeksi dataa liikekohtaiseen kehitykseen.</p>
        <p className="mt-1 text-sm">Tarvitaan vähintään 2 suoritusta per liike.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="border-b border-white/8 px-5 py-4">
        <h3 className="text-base font-semibold">Liikekohtainen kehitys</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Kaikki seuratut liikkeet — e1RM-arvio (Epley)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Liike</th>
              <th className="px-3 py-3 font-medium text-right">Treenit</th>
              <th className="px-3 py-3 font-medium text-right">Nykyinen</th>
              <th className="px-3 py-3 font-medium text-right">Paras</th>
              <th className="px-3 py-3 font-medium text-right">Muutos</th>
              <th className="px-5 py-3 font-medium text-right">Trendi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {exercises.map((row) => (
              <tr key={row.exerciseName} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3.5 font-medium text-foreground">{row.exerciseName}</td>
                <td className="px-3 py-3.5 text-right tabular-nums text-muted-foreground">
                  {row.sessionCount}
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums font-semibold">
                  {row.currentE1RM} kg
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums text-muted-foreground">
                  {row.bestE1RM} kg
                </td>
                <td
                  className={cn(
                    'px-3 py-3.5 text-right tabular-nums font-medium',
                    row.changePercent != null && row.changePercent > 0 && 'text-primary',
                    row.changePercent != null && row.changePercent < 0 && 'text-destructive',
                    row.changePercent == null && 'text-muted-foreground',
                  )}
                >
                  {row.changePercent != null ? `${row.changePercent > 0 ? '+' : ''}${row.changePercent} %` : '—'}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <TrendIcon trend={row.trend} />
                    <span className="text-xs text-muted-foreground">{trendLabel[row.trend]}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
