import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import DevelopmentHero from '@/components/client-analytics/DevelopmentHero';
import PersonalRecordsTimeline from '@/components/client-analytics/PersonalRecordsTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, BarChart3 } from 'lucide-react';
import { endOfWeek, format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { fi } from 'date-fns/locale';
import { getClientAnalytics } from '@/lib/client-analytics/queries';
import { getVolumeTrendLabel } from '@/lib/dashboard/metrics';
import {
  resolveActiveProgramMeta,
  resolveCycleStatus,
} from '@/lib/programs/cycle-status';
import ActiveProgramCard from '@/components/programs/ActiveProgramCard';
import { fetchNotedSessionIds, formatSessionSummaries } from '@/lib/sessions/format';
import { cn } from '@/lib/utils';

export default async function ClientOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.id;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const eightWeeksAgo = subWeeks(new Date(), 8);
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });

  const [
    { data: sessions },
    { data: assignment },
    { data: relationship },
    { data: managedWorkout },
    analytics,
  ] = await Promise.all([
      supabase
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
          cycle_week,
          workout_id,
          workouts ( program, workout_type, cycle_weeks, programmed_deloads ),
          session_exercises ( id )
        `)
        .eq('user_id', clientId)
        .gte('date', eightWeeksAgo.toISOString())
        .order('date', { ascending: false })
        .limit(50),
      supabase
        .from('coach_program_assignments')
        .select(`
          assigned_at,
          workouts ( program, cycle_weeks, workout_type, programmed_deloads )
        `)
        .eq('client_id', clientId)
        .eq('coach_id', user?.id ?? '')
        .order('assigned_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('coach_clients')
        .select('notes')
        .eq('client_id', clientId)
        .eq('coach_id', user?.id ?? '')
        .maybeSingle(),
      supabase
        .from('workouts')
        .select('program, cycle_weeks, workout_type, programmed_deloads')
        .eq('user_id', clientId)
        .eq('managed_by_coach', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    getClientAnalytics(clientId, user.id, { periodWeeks: 8 }),
  ]);

  const sessionRows = sessions ?? [];
  const latestSession = sessionRows[0];
  const assignedWorkout = assignment?.workouts as {
    program: string | null;
    cycle_weeks: number | null;
    workout_type: string | null;
    programmed_deloads: number[] | null;
  } | null;

  const programMeta = resolveActiveProgramMeta(
    assignedWorkout,
    managedWorkout,
    latestSession?.workouts as {
      program: string | null;
      cycle_weeks: number | null;
      programmed_deloads: number[] | null;
    } | null,
  );

  const cycleStatus = resolveCycleStatus(
    sessionRows.map((session) => ({
      date: session.date,
      cycle_week: session.cycle_week,
      workout_id: session.workout_id,
    })),
    programMeta,
  );

  const programLabel = cycleStatus.programName ?? 'Ei määritetty';
  const hasAssignedProgram = Boolean(cycleStatus.programName);
  const activeWorkoutType =
    assignedWorkout?.workout_type ??
    managedWorkout?.workout_type ??
    latestSession?.workouts?.workout_type ??
    null;
  const coachNotes = relationship?.notes?.trim() ?? '';

  const thisWeekSessions = sessionRows.filter((s) => {
    if (!s.date) return false;
    return parseISO(s.date) >= weekStart;
  });

  const thisWeekVolume = thisWeekSessions.reduce(
    (sum, s) => sum + (s.total_volume ?? 0),
    0,
  );

  const previousWeekVolumes: number[] = [];
  for (let i = 1; i <= 4; i++) {
    const wStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const wEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const vol = sessionRows
      .filter((s) => {
        if (!s.date) return false;
        const d = parseISO(s.date);
        return d >= wStart && d <= wEnd;
      })
      .reduce((sum, s) => sum + (s.total_volume ?? 0), 0);
    previousWeekVolumes.push(vol);
  }

  const prev4WeekAvg =
    previousWeekVolumes.length > 0
      ? previousWeekVolumes.reduce((a, b) => a + b, 0) / previousWeekVolumes.length
      : 0;

  const volumeTrend = getVolumeTrendLabel(thisWeekVolume, prev4WeekAvg);

  const recentSessionIds = sessionRows.slice(0, 5).map((s) => s.id);
  const notedSessionIds = user
    ? await fetchNotedSessionIds(supabase, user.id, recentSessionIds)
    : new Set<string>();

  const formattedSessions = formatSessionSummaries(
    sessionRows.slice(0, 5),
    notedSessionIds,
  );

  return (
    <div className="space-y-6">
      {analytics?.hasSessions && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Kehitys</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              render={<Link href={`/clients/${clientId}/analytics`} />}
              nativeButton={false}
            >
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Täysi analytiikka
            </Button>
          </div>
          <DevelopmentHero summary={analytics.summary} periodWeeks={8} compact />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viimeisin treeni</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestSession?.date
                ? format(parseISO(latestSession.date), 'd.M.yyyy', { locale: fi })
                : '—'}
            </div>
            {latestSession?.workouts?.program && (
              <p className="mt-1 text-xs text-muted-foreground truncate">
                {latestSession.workouts.program}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viikon volyymi</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {thisWeekVolume.toLocaleString('fi-FI')} kg
            </div>
            <p
              className={cn(
                'text-xs mt-1 font-medium',
                volumeTrend.tone === 'up' && 'text-primary',
                volumeTrend.tone === 'down' && 'text-muted-foreground',
                volumeTrend.tone === 'neutral' && 'text-muted-foreground',
              )}
            >
              {volumeTrend.text}
            </p>
          </CardContent>
        </Card>

        <ActiveProgramCard
          cycleStatus={cycleStatus}
          programLabel={programLabel}
          hasAssignedProgram={hasAssignedProgram}
          clientId={clientId}
          workoutType={activeWorkoutType}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <RecentActivityFeed sessions={formattedSessions} clientId={clientId} />
          {analytics?.hasSessions && analytics.personalRecords.length > 0 && (
            <PersonalRecordsTimeline
              records={analytics.personalRecords}
              clientId={clientId}
              limit={3}
            />
          )}
        </div>
        <div className="space-y-6">
          <Card className="bg-card border-border h-full">
            <CardHeader>
              <CardTitle className="text-lg">Valmentajan muistiinpanot</CardTitle>
            </CardHeader>
            <CardContent>
              {coachNotes ? (
                <p className="text-sm text-foreground whitespace-pre-wrap">{coachNotes}</p>
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  Ei muistiinpanoja urheilijasta.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
