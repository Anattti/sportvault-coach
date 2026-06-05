import { createServerSupabaseClient } from '@/lib/supabase/server';
import VolumeChart from '@/components/analytics/VolumeChart';
import E1RMChart from '@/components/analytics/E1RMChart';
import { getWeeklyVolumeTrend, getExerciseE1RMTrend, WorkoutSessionWithSets, AnalyticsWorkoutSet } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default async function ClientAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.id;
  const supabase = await createServerSupabaseClient();

  // Haetaan treenisessiot ja niihin kuuluvat liikkeet ja sarjat
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      date,
      duration,
      total_volume,
      session_exercises (
        name,
        session_sets (
          weight_used,
          reps_completed
        )
      )
    `)
    .eq('user_id', clientId)
    .order('date', { ascending: true }); // Vanhimmasta uusimpaan analyysia varten

  if (error) {
    console.error('Analytics fetch failed:', error.message, error.code, error.details);
    return (
      <div className="text-muted-foreground">
        Analytiikkadataa ei voitu ladata. Varmista, että asiakassuhde on aktiivinen.
      </div>
    );
  }

  // Muunnetaan data analytiikan ymmärtämään muotoon
  const analyticsData: WorkoutSessionWithSets[] = (sessions || []).map((s: any) => ({
    id: s.id,
    date: s.date,
    duration: s.duration || 0,
    total_volume: s.total_volume || 0,
    exercises: (s.session_exercises || []).map((ex: any) => ({
      name: ex.name,
      category: null,
      sets: (ex.session_sets || []).map((set: any) => ({
        weight_used: set.weight_used || 0,
        reps_completed: set.reps_completed || 0,
      }))
    }))
  }));

  // 1. Viikoittainen volyymi
  const volumeData = getWeeklyVolumeTrend(analyticsData, 8); // Viimeiset 8 viikkoa

  // 2. Selvitetään yleisimmät liikkeet E1RM-seurantaan
  const exerciseCounts: Record<string, number> = {};
  analyticsData.forEach(session => {
    session.exercises.forEach(ex => {
      exerciseCounts[ex.name] = (exerciseCounts[ex.name] || 0) + 1;
    });
  });

  // Otetaan 2-3 eniten tehtyä liikettä (joilla yli 1 suorituskerta)
  const topExercises = Object.entries(exerciseCounts)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([name]) => name);

  // Lasketaan E1RM-datat top liikkeille
  const e1rmCharts = topExercises.map(exerciseName => {
    // Suodata vain ne sessiot, joissa kyseistä liikettä tehtiin
    const sessionsWithEx = analyticsData.filter(s => s.exercises.some(ex => ex.name === exerciseName));
    
    const formattedForE1RM = sessionsWithEx.map(s => {
      const exercise = s.exercises.find(ex => ex.name === exerciseName);
      return {
        date: s.date,
        sets: exercise?.sets || []
      };
    });

    return getExerciseE1RMTrend(exerciseName, formattedForE1RM);
  });

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-5 w-5 text-primary" />;
    if (trend === 'down') return <TrendingDown className="h-5 w-5 text-destructive" />;
    return <Minus className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kehitysanalyysi</h2>
        <p className="text-muted-foreground">Seuraa urheilijan progressiota volyymin ja voimatasojen (e1RM) avulla.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <VolumeChart data={volumeData} />
          
          {e1rmCharts.length > 0 && (
            <div className="space-y-6 mt-8">
              <h3 className="text-xl font-bold tracking-tight">Pääliikkeiden progressio</h3>
              <div className="grid gap-6 md:grid-cols-2">
                {e1rmCharts.map(chart => (
                  <E1RMChart 
                    key={chart.exerciseName}
                    exerciseName={chart.exerciseName} 
                    data={chart.history ?? []} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Kehityksen tilanne</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {e1rmCharts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ei tarpeeksi dataa kehityksen arviointiin.</p>
              ) : (
                e1rmCharts.map(chart => (
                  <div key={chart.exerciseName} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg border border-border">
                    <div>
                      <p className="font-medium text-sm">{chart.exerciseName}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Paras: <span className="text-foreground font-bold">{chart.bestE1RM} kg</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end">
                      {getTrendIcon(chart.trend)}
                      <span className="text-xs mt-1 font-medium capitalize">{chart.trend === 'up' ? 'Nousussa' : chart.trend === 'down' ? 'Laskussa' : 'Tasainen'}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
