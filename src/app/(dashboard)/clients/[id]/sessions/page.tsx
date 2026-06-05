import { createServerSupabaseClient } from '@/lib/supabase/server';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import { SessionSummary } from '@/types';

export default async function ClientSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.id;
  const supabase = await createServerSupabaseClient();

  // Hae kaikki sessiot
  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      date,
      duration,
      total_volume,
      feeling,
      rpe_average,
      heart_rate_avg,
      heart_rate_max,
      workouts ( program, workout_type )
    `)
    .eq('user_id', clientId)
    .order('date', { ascending: false });

  const formattedSessions: SessionSummary[] = (sessions || []).map((s: any) => ({
    id: s.id,
    date: s.date,
    duration: s.duration || 0,
    totalVolume: s.total_volume || 0,
    feeling: s.feeling,
    rpeAverage: s.rpe_average,
    heartRateAvg: s.heart_rate_avg,
    heartRateMax: s.heart_rate_max,
    workoutName: s.workouts?.program || null,
    workoutType: s.workouts?.workout_type || null,
    exerciseCount: 0,
    hasCoachNote: false,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Treenihistoria</h2>
          <p className="text-muted-foreground">Kaikki urheilijan suorittamat treenit.</p>
        </div>
      </div>
      
      <div className="max-w-4xl">
        <RecentActivityFeed sessions={formattedSessions} clientId={clientId} />
      </div>
    </div>
  );
}
