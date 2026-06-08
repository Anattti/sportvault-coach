import { Activity, Clock, Dumbbell, CheckCircle2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import KpiCard from '@/components/dashboard/KpiCard';
import RpeBadge, { RpeKpiCard } from '@/components/sessions/RpeBadge';
import { calculateE1RM } from '@/lib/analytics';
import { SessionDetail as SessionDetailType } from '@/types';
import { cn } from '@/lib/utils';

interface SessionDetailProps {
  data: SessionDetailType;
  previousBestByExercise?: Record<string, number>;
}

export default function SessionDetail({ data, previousBestByExercise = {} }: SessionDetailProps) {
  const { session, exercises } = data;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} min ${s} s`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Kesto"
          value={formatDuration(session.duration)}
          icon={Clock}
        />
        <KpiCard
          title="Volyymi"
          value={`${session.totalVolume.toLocaleString('fi-FI')} kg`}
          icon={Dumbbell}
        />
        <KpiCard
          title="Keskisyke"
          value={session.heartRateAvg ? `${session.heartRateAvg} bpm` : '—'}
          subtitle={
            session.heartRateMax
              ? `Max ${session.heartRateMax} bpm`
              : undefined
          }
          icon={Activity}
        />
        <RpeKpiCard rpeAverage={session.rpeAverage} />
      </div>

      {session.notes && (
        <div className="glass-panel rounded-2xl border-primary/20 bg-primary/[0.03] px-5 py-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
            Urheilijan muistiinpano
          </p>
          <p className="text-sm italic text-muted-foreground leading-relaxed">
            &quot;{session.notes}&quot;
          </p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="px-1 text-base font-semibold">Suoritetut liikkeet</h3>

        <div className="space-y-4">
          {exercises.map((ex, i) => {
            const sessionE1RM = Math.max(
              0,
              ...ex.sets.map((set) =>
                set.weightUsed && set.repsCompleted
                  ? calculateE1RM(set.weightUsed, set.repsCompleted)
                  : 0,
              ),
            );
            const previousBest = previousBestByExercise[ex.name];
            const isPR = sessionE1RM > 0 && previousBest != null && sessionE1RM > previousBest;

            return (
              <div key={ex.id} className="glass-panel rounded-2xl overflow-hidden">
                <div className="flex flex-row items-center justify-between border-b border-white/8 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.04] text-xs font-bold text-muted-foreground ring-1 ring-white/8">
                      {i + 1}
                    </div>
                    <span className="truncate text-base font-semibold">{ex.name}</span>
                    {sessionE1RM > 0 && (
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        e1RM {sessionE1RM} kg
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {isPR && (
                      <Badge className="border-primary/30 bg-primary/15 text-primary">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Ennätys
                      </Badge>
                    )}
                    {ex.notes && (
                      <Badge variant="outline" className="border-accent text-accent">
                        Huomioita
                      </Badge>
                    )}
                  </div>
                </div>

                {ex.notes && (
                  <div className="border-b border-white/8 bg-accent/[0.03] px-5 py-3 text-sm italic text-muted-foreground">
                    &quot;{ex.notes}&quot;
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-3 font-medium">Sarja</th>
                        <th className="px-3 py-3 font-medium">Paino</th>
                        <th className="px-3 py-3 font-medium">Toistot</th>
                        <th className="px-3 py-3 font-medium">RPE</th>
                        <th className="hidden sm:table-cell px-3 py-3 font-medium">e1RM</th>
                        <th className="hidden sm:table-cell px-5 py-3 font-medium">Lepo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ex.sets.map((set, setIdx) => {
                        const setE1RM =
                          set.weightUsed && set.repsCompleted
                            ? calculateE1RM(set.weightUsed, set.repsCompleted)
                            : null;
                        return (
                          <tr key={setIdx} className="transition-colors hover:bg-white/[0.02]">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-medium tabular-nums">{set.setIndex}</span>
                                {set.completedAt && (
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3.5 font-semibold tabular-nums">
                              {set.weightUsed !== null ? `${set.weightUsed} kg` : '—'}
                            </td>
                            <td className="px-3 py-3.5 font-semibold tabular-nums">
                              {set.repsCompleted !== null ? set.repsCompleted : '—'}
                            </td>
                            <td className="px-3 py-3.5">
                              {set.rpe != null ? (
                                <RpeBadge rpe={set.rpe} size="lg" />
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="hidden sm:table-cell px-3 py-3.5 tabular-nums text-muted-foreground">
                              {setE1RM ? `${setE1RM} kg` : '—'}
                            </td>
                            <td className="hidden sm:table-cell px-5 py-3.5 tabular-nums text-muted-foreground">
                              {set.restTimeTaken
                                ? `${Math.floor(set.restTimeTaken / 60)}m ${set.restTimeTaken % 60}s`
                                : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
