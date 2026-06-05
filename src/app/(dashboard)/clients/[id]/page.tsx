import { createServerSupabaseClient } from '@/lib/supabase/server';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Trophy, Clock } from 'lucide-react';
import { SessionSummary } from '@/types';

export default async function ClientOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.id;
  const supabase = await createServerSupabaseClient();

  // Hae viimeisimmät 5 sessiota
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
    .order('date', { ascending: false })
    .limit(5);

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
    exerciseCount: 0, // Voidaan hakea erikseen jos tarvitaan
    hasCoachNote: false, // Myöhemmin check
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viimeisin Treeni</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formattedSessions.length > 0 ? formattedSessions[0].date : '-'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viikon Volyymi</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* Laske vain kuluvan viikon volyymi (mock implementation) */}
              {formattedSessions.reduce((sum, s) => sum + s.totalVolume, 0).toLocaleString()} kg
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-accent">
              Hyvässä vauhdissa
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiivinen Ohjelma</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Ei määritetty</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <RecentActivityFeed sessions={formattedSessions} clientId={clientId} />
        </div>
        <div className="space-y-6">
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <CardTitle className="text-lg">Valmentajan Muistiinpanot</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm italic">
                Ei muistiinpanoja urheilijasta.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
