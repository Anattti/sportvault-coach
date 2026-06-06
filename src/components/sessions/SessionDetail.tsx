import { format } from 'date-fns';
import { Activity, Clock, Dumbbell, Flame, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kesto</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(session.duration)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volyymi</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.totalVolume} kg</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keskisyke</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.heartRateAvg ? `${session.heartRateAvg} bpm` : '-'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Max: {session.heartRateMax ? `${session.heartRateMax} bpm` : '-'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Koettu rasitus (RPE)</CardTitle>
            <Flame className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{session.rpeAverage?.toFixed(1) || '-'}</div>
          </CardContent>
        </Card>
      </div>

      {session.notes && (
        <Card className="bg-card border-border bg-accent/5 border-accent/20">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-accent mb-1">Urheilijan muistiinpano:</p>
            <p className="text-sm italic">&quot;{session.notes}&quot;</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-bold tracking-tight">Suoritetut liikkeet</h3>

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
              <Card key={ex.id} className="bg-card border-border overflow-hidden">
                <CardHeader className="bg-muted/30 py-3 border-b border-border flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-background text-muted-foreground h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border border-border">
                      {i + 1}
                    </div>
                    <CardTitle className="text-lg">{ex.name}</CardTitle>
                    {sessionE1RM > 0 && (
                      <span className="text-sm text-muted-foreground tabular-nums">
                        e1RM {sessionE1RM} kg
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isPR && (
                      <Badge className="bg-primary/15 text-primary border-primary/30">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        Ennätys
                      </Badge>
                    )}
                    {ex.notes && (
                      <Badge variant="outline" className="border-accent text-accent">Huomioita</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {ex.notes && (
                    <div className="px-4 py-3 bg-accent/5 border-b border-border text-sm italic">
                      &quot;{ex.notes}&quot;
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground bg-background border-b border-border">
                        <tr>
                          <th className="px-4 py-2 font-medium">Sarja</th>
                          <th className="px-4 py-2 font-medium">Paino</th>
                          <th className="px-4 py-2 font-medium">Toistot</th>
                          <th className="px-4 py-2 font-medium">RPE</th>
                          <th className="px-4 py-2 font-medium">e1RM</th>
                          <th className="px-4 py-2 font-medium">Lepo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {ex.sets.map((set, setIdx) => {
                          const setE1RM =
                            set.weightUsed && set.repsCompleted
                              ? calculateE1RM(set.weightUsed, set.repsCompleted)
                              : null;
                          return (
                            <tr key={setIdx} className="hover:bg-muted/20">
                              <td className="px-4 py-3 flex items-center gap-2">
                                <span className="font-medium">{set.setIndex}</span>
                                {set.completedAt && <CheckCircle2 className="h-3 w-3 text-primary" />}
                              </td>
                              <td className="px-4 py-3 font-semibold">{set.weightUsed !== null ? `${set.weightUsed} kg` : '-'}</td>
                              <td className="px-4 py-3 font-semibold">{set.repsCompleted !== null ? set.repsCompleted : '-'}</td>
                              <td className="px-4 py-3">
                                {set.rpe ? (
                                  <Badge variant="outline" className={cn(set.rpe >= 9 ? 'text-destructive border-destructive/50' : 'text-accent border-accent/50')}>
                                    {set.rpe}
                                  </Badge>
                                ) : '-'}
                              </td>
                              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                {setE1RM ? `${setE1RM} kg` : '-'}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {set.restTimeTaken ? `${Math.floor(set.restTimeTaken / 60)}m ${set.restTimeTaken % 60}s` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
