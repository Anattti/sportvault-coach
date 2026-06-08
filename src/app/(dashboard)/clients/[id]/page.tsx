import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import DevelopmentHero from '@/components/client-analytics/DevelopmentHero';
import PersonalRecordsTimeline from '@/components/client-analytics/PersonalRecordsTimeline';
import AdherenceSummaryCompact from '@/components/client-analytics/AdherenceSummaryCompact';
import ClientAttentionBanner from '@/components/clients/ClientAttentionBanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, BarChart3, Flame, AlertTriangle } from 'lucide-react';
import { endOfWeek, format, formatDistanceToNow, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { fi } from 'date-fns/locale';
import { getClientAnalytics } from '@/lib/client-analytics/queries';
import { getVolumeTrendLabel } from '@/lib/dashboard/metrics';
import { resolveClientAttentionAlerts } from '@/lib/clients/attention';
import {
  resolveActiveProgramMeta,
  resolveCycleStatus,
} from '@/lib/programs/cycle-status';
import ActiveProgramCard from '@/components/programs/ActiveProgramCard';
import { fetchNotedSessionIds, formatSessionSummaries } from '@/lib/sessions/format';
import { CoachClient } from '@/types';
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
      .select('status')
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

  const clientStatus = (relationship?.status ?? 'pending') as CoachClient['status'];
  const lastSessionDate = latestSession?.date ?? null;

  const attentionAlerts = resolveClientAttentionAlerts({
    status: clientStatus,
    sessions: sessionRows,
    hasAssignedProgram,
    programStuck: cycleStatus.programStuck,
    cycleWeek: cycleStatus.currentWeek,
    lastSessionDate,
  });

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

  const latestRpe = latestSession?.rpe_average;
  const latestRpeElevated = latestRpe != null && latestRpe > 8.5;
  const isInactive = attentionAlerts.some(
    (a) => a.reason === 'inactive' || a.reason === 'no_sessions',
  );

  const lastSessionCard = latestSession?.date ? (
    <Link
      href={`/clients/${clientId}/sessions/${latestSession.id}`}
      className="block transition-opacity hover:opacity-90"
    >
      <Card className="bg-card border-border h-full transition-colors hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Viimeisin treeni</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format(parseISO(latestSession.date), 'd.M.yyyy', { locale: fi })}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDistanceToNow(parseISO(latestSession.date), {
              addSuffix: true,
              locale: fi,
            })}
          </p>
          {latestRpe != null && (
            <div
              className={cn(
                'mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
                latestRpeElevated
                  ? 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20'
                  : 'bg-accent/10 text-muted-foreground',
              )}
            >
              <Flame className="h-3 w-3" />
              RPE {latestRpe.toFixed(1)}
            </div>
          )}
          {isInactive && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              Pitkä tauko treeneistä
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  ) : (
    <Card className="bg-card border-border h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Viimeisin treeni</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">—</div>
        <p className="mt-1 text-xs text-muted-foreground">Ei treenihistoriaa</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <ClientAttentionBanner alerts={attentionAlerts} clientId={clientId} />

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
        {lastSessionCard}

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
          {analytics?.hasSessions && analytics.adherence.sessionsAnalyzed > 0 ? (
            <AdherenceSummaryCompact
              adherence={analytics.adherence}
              clientId={clientId}
            />
          ) : (
            <Card className="bg-card border-border h-full">
              <CardHeader>
                <CardTitle className="text-lg">Ohjelman toteutus</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Toteutusdata näkyy, kun urheilijalla on ohjelmaan linkitettyjä treenejä.
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-2 h-auto p-0 text-primary"
                  render={<Link href={`/clients/${clientId}/analytics`} />}
                  nativeButton={false}
                >
                  Avaa analytiikka →
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
