import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { PendingInvitation } from '@/components/clients/PendingInvitations';
import {
  buildProgramContextMap,
  ClientProgramContext,
  computeCompliancePercent,
  computePortfolioCompliance,
  getCurrentWeekBounds,
  getPlannedSessionsThisWeek,
  isDateInCurrentWeek,
  SessionForCompliance,
} from '@/lib/dashboard/compliance';
import { analyzeProgressData } from '@/lib/dashboard/progress';
import {
  resolveActiveProgramMeta,
  resolveCycleStatus,
} from '@/lib/programs/cycle-status';
import {
  buildWeeklyMetrics,
  computePercentChange,
  getPortfolioVolumeSpike,
  hasClientVolumeSpike,
  isRpeElevated,
} from '@/lib/dashboard/metrics';
import { getLastSeenAt } from '@/lib/dashboard/notifications';
import { fetchNotedSessionIds, fetchAthleteNoteSessionIds, enrichWithSessionNoteFlags } from '@/lib/sessions/format';
import {
  AttentionClient,
  ClientOverview,
  CoachActivitySession,
  PersonalRecord,
  VolumeSpikeAlert,
  WeeklyMetricPoint,
  WeeklyVolumePoint,
} from '@/types';
import {
  differenceInDays,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns';
import { fi } from 'date-fns/locale';

export interface DashboardStats {
  activeClients: number;
  newClientsThisWeek: number;
  clientsTrainedThisWeek: number;
  trainingRatePercent: number;
  pendingInvites: number;
  sessionsThisWeek: number;
  sessionsPlannedThisWeek: number;
  compliancePercent: number | null;
  totalVolumeThisWeek: number;
  volumeChangePercent: number | null;
  avgRpeThisWeek: number | null;
}

export interface DashboardData {
  coachName: string;
  stats: DashboardStats;
  clientOverviews: ClientOverview[];
  attentionClients: AttentionClient[];
  recentSessions: CoachActivitySession[];
  pendingInvitations: PendingInvitation[];
  weeklyVolume: WeeklyVolumePoint[];
  weeklySessions: WeeklyMetricPoint[];
  volumeSpike: VolumeSpikeAlert | null;
  recentPRs: PersonalRecord[];
  hasClients: boolean;
}

type SessionRow = {
  id: string;
  user_id: string | null;
  workout_id: string | null;
  date: string | null;
  created_at: string | null;
  duration: number | null;
  total_volume: number | null;
  feeling: number | null;
  rpe_average: number | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  notes: string | null;
  cycle_week: number | null;
  workouts: {
    program: string | null;
    workout_type: string | null;
    cycle_weeks: number | null;
    programmed_deloads: number[] | null;
  } | null;
};

function sessionDate(row: SessionRow): Date | null {
  if (!row.date) return null;
  return parseISO(row.date);
}

function isOnOrAfterWeekStart(date: Date, weekStart: Date): boolean {
  return date >= weekStart;
}

function isWithinWeek(date: Date, weekStart: Date, weekEnd: Date): boolean {
  return date >= weekStart && date <= weekEnd;
}

function buildClientOverview(
  clientId: string,
  nickname: string,
  clientSessions: SessionRow[],
  programContext: ClientProgramContext,
  assignmentWorkout: {
    program: string | null;
    cycle_weeks: number | null;
    programmed_deloads: number[] | null;
  } | null,
  managedWorkout: {
    program: string | null;
    cycle_weeks: number | null;
    programmed_deloads: number[] | null;
  } | null,
  weekStart: Date,
  prevWeekStart: Date,
  prevWeekEnd: Date,
  sevenDaysAgo: Date,
): ClientOverview {
  const sorted = [...clientSessions].sort((a, b) => {
    const da = sessionDate(a)?.getTime() ?? 0;
    const db = sessionDate(b)?.getTime() ?? 0;
    return db - da;
  });

  const weekSessions = sorted.filter((s) => {
    const d = sessionDate(s);
    return d && isOnOrAfterWeekStart(d, weekStart);
  });

  const prevWeekSessions = sorted.filter((s) => {
    const d = sessionDate(s);
    return d && isWithinWeek(d, prevWeekStart, prevWeekEnd);
  });

  const lastSession = sorted[0];
  const lastDate = lastSession?.date ?? null;
  const lastSessionTime = lastDate ? parseISO(lastDate) : null;
  const inactive = !lastSessionTime || lastSessionTime < sevenDaysAgo;

  const rpeValues = weekSessions
    .map((s) => s.rpe_average)
    .filter((v): v is number => v != null);

  const totalVolumeThisWeek = weekSessions.reduce(
    (sum, s) => sum + (s.total_volume ?? 0),
    0,
  );
  const totalVolumePrevWeek = prevWeekSessions.reduce(
    (sum, s) => sum + (s.total_volume ?? 0),
    0,
  );

  const plannedSessionsThisWeek = getPlannedSessionsThisWeek(programContext);
  const compliancePercent = computeCompliancePercent(
    weekSessions.length,
    plannedSessionsThisWeek,
  );

  const complianceSessions: SessionForCompliance[] = clientSessions.map((s) => ({
    date: s.date,
    cycle_week: s.cycle_week,
    workout_id: s.workout_id,
  }));

  const programMeta = resolveActiveProgramMeta(
    assignmentWorkout,
    managedWorkout,
    lastSession?.workouts ?? null,
  );
  const cycleStatus = resolveCycleStatus(complianceSessions, programMeta);

  return {
    clientId,
    nickname,
    lastSessionDate: lastDate,
    totalSessionsThisWeek: weekSessions.length,
    totalVolumeThisWeek,
    volumeChangePercent: computePercentChange(totalVolumeThisWeek, totalVolumePrevWeek),
    avgRpe:
      rpeValues.length > 0
        ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length
        : null,
    rpeElevated: isRpeElevated(sorted),
    trainedThisWeek: weekSessions.length > 0,
    cycleWeek: cycleStatus.currentWeek,
    cycleWeeks: cycleStatus.totalWeeks,
    programmedDeloads: cycleStatus.programmedDeloads,
    isDeloadWeek: cycleStatus.isDeloadWeek,
    hasCycle: cycleStatus.hasCycle,
    programName: lastSession?.workouts?.program ?? programContext.activeProgramName,
    activeProgramName: programContext.activeProgramName ?? cycleStatus.programName,
    hasAssignedProgram: programContext.hasAssignedProgram,
    plannedSessionsThisWeek,
    compliancePercent,
    programStuck: cycleStatus.programStuck,
    topExerciseName: null,
    topExerciseE1RM: null,
    topExerciseTrend: null,
    status: inactive ? 'inactive' : 'active',
  };
}

function buildWeeklyVolume(sessions: SessionRow[], weeksCount = 8): WeeklyVolumePoint[] {
  return buildWeeklyMetrics(
    sessions,
    weeksCount,
    (s) => s.total_volume ?? 0,
    (weekStart) => format(weekStart, 'd.M.', { locale: fi }),
  ).map(({ label, value, isCurrentWeek }) => ({
    label,
    volume: value,
    isCurrentWeek,
  }));
}

function buildWeeklySessions(sessions: SessionRow[], weeksCount = 8): WeeklyMetricPoint[] {
  return buildWeeklyMetrics(
    sessions,
    weeksCount,
    () => 1,
    (weekStart) => format(weekStart, 'd.M.', { locale: fi }),
  );
}

const ATTENTION_PRIORITY: Record<AttentionClient['reason'], number> = {
  pending: 0,
  no_program: 1,
  program_stuck: 2,
  volume_spike: 3,
  high_rpe: 4,
  no_sessions: 5,
  inactive: 6,
};

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const prevWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const sevenDaysAgo = subDays(now, 7);
  const eightWeeksAgo = subWeeks(now, 8);
  const lastSeenAt = await getLastSeenAt();

  const [{ data: coachProfile }, { data: clients }, { data: pendingInvitations }] =
    await Promise.all([
      supabase
        .from('coach_profiles')
        .select('business_name')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('coach_clients')
        .select('id, client_id, status, accepted_at')
        .eq('coach_id', user.id),
      supabase
        .from('coach_invitations')
        .select('id, invite_code, client_email, expires_at, created_at')
        .eq('coach_id', user.id)
        .is('used_at', null)
        .gt('expires_at', now.toISOString())
        .order('created_at', { ascending: false }),
    ]);

  const coachName =
    coachProfile?.business_name || user.email?.split('@')[0] || 'Valmentaja';

  const clientRows = clients ?? [];
  const activeClientRows = clientRows.filter((c) => c.status === 'active');
  const clientIds = clientRows.map((c) => c.client_id);

  const profilesById = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, nickname')
      .in('id', clientIds);

    for (const p of profiles ?? []) {
      profilesById.set(p.id, p.nickname ?? 'Nimetön urheilija');
    }
  }

  const { weekStart: currentWeekStart, weekEnd: currentWeekEnd } = getCurrentWeekBounds(now);

  let sessions: SessionRow[] = [];
  let programContextByClient = new Map<string, ClientProgramContext>();
  let recentPRs: PersonalRecord[] = [];
  let progressByClient = new Map<
    string,
    { exerciseName: string; currentE1RM: number; trend: 'up' | 'down' | 'stable' } | null
  >();
  let assignmentWorkoutByClient = new Map<
    string,
    {
      program: string | null;
      cycle_weeks: number | null;
      programmed_deloads: number[] | null;
    }
  >();
  let managedWorkoutByClient = new Map<
    string,
    {
      program: string | null;
      cycle_weeks: number | null;
      programmed_deloads: number[] | null;
    }
  >();

  if (clientIds.length > 0) {
    const [
      { data: sessionData },
      { data: assignments },
      { data: managedWorkouts },
      { data: scheduledWorkouts },
      { data: progressSessionData },
    ] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select(`
          id,
          user_id,
          workout_id,
          date,
          created_at,
          duration,
          total_volume,
          feeling,
          rpe_average,
          heart_rate_avg,
          heart_rate_max,
          notes,
          cycle_week,
          workouts ( program, workout_type, cycle_weeks, programmed_deloads )
        `)
        .in('user_id', clientIds)
        .gte('date', eightWeeksAgo.toISOString())
        .order('date', { ascending: false })
        .limit(500),
      supabase
        .from('coach_program_assignments')
        .select(`
          client_id,
          workout_id,
          assigned_at,
          workouts ( program, cycle_weeks, programmed_deloads )
        `)
        .eq('coach_id', user.id)
        .in('client_id', clientIds)
        .order('assigned_at', { ascending: false }),
      supabase
        .from('workouts')
        .select('id, user_id, program, cycle_weeks, programmed_deloads')
        .in('user_id', clientIds)
        .eq('managed_by_coach', true),
      supabase
        .from('scheduled_workouts')
        .select('user_id, scheduled_date, status')
        .in('user_id', clientIds)
        .gte('scheduled_date', currentWeekStart.toISOString().slice(0, 10))
        .lte('scheduled_date', currentWeekEnd.toISOString().slice(0, 10)),
      supabase
        .from('workout_sessions')
        .select(`
          id,
          user_id,
          date,
          session_exercises (
            name,
            session_sets (
              weight_used,
              reps_completed
            )
          )
        `)
        .in('user_id', clientIds)
        .gte('date', eightWeeksAgo.toISOString())
        .order('date', { ascending: true })
        .limit(300),
    ]);

    sessions = (sessionData ?? []) as SessionRow[];

    const progress = analyzeProgressData(
      (progressSessionData ?? []) as Parameters<typeof analyzeProgressData>[0],
      profilesById,
    );
    recentPRs = progress.recentPRs;
    if (recentPRs.length > 0) {
      const prSessionIds = recentPRs.map((record) => record.sessionId);
      const [athleteNoteIds, coachNoteIds] = await Promise.all([
        fetchAthleteNoteSessionIds(supabase, prSessionIds),
        fetchNotedSessionIds(supabase, user.id, prSessionIds),
      ]);
      recentPRs = enrichWithSessionNoteFlags(recentPRs, athleteNoteIds, coachNoteIds);
    }
    progressByClient = progress.progressByClient;

    const scheduledThisWeekByClient = new Map<string, number>();
    for (const row of scheduledWorkouts ?? []) {
      if (row.status === 'cancelled') continue;
      if (!isDateInCurrentWeek(row.scheduled_date, currentWeekStart, currentWeekEnd)) continue;
      scheduledThisWeekByClient.set(
        row.user_id,
        (scheduledThisWeekByClient.get(row.user_id) ?? 0) + 1,
      );
    }

    programContextByClient = buildProgramContextMap(
      clientIds,
      (assignments ?? []) as Array<{
        client_id: string;
        workout_id: string;
        workouts: { program: string | null } | null;
      }>,
      managedWorkouts ?? [],
      scheduledThisWeekByClient,
    );

    for (const assignment of assignments ?? []) {
      if (assignmentWorkoutByClient.has(assignment.client_id)) continue;
      const workout = assignment.workouts as {
        program: string | null;
        cycle_weeks: number | null;
        programmed_deloads: number[] | null;
      } | null;
      if (workout) {
        assignmentWorkoutByClient.set(assignment.client_id, workout);
      }
    }

    for (const workout of managedWorkouts ?? []) {
      if (managedWorkoutByClient.has(workout.user_id)) continue;
      managedWorkoutByClient.set(workout.user_id, {
        program: workout.program,
        cycle_weeks: workout.cycle_weeks,
        programmed_deloads: workout.programmed_deloads,
      });
    }
  }

  const sessionsByClient = new Map<string, SessionRow[]>();
  for (const session of sessions) {
    if (!session.user_id) continue;
    const list = sessionsByClient.get(session.user_id) ?? [];
    list.push(session);
    sessionsByClient.set(session.user_id, list);
  }

  const weekSessions = sessions.filter((s) => {
    const d = sessionDate(s);
    return d && isOnOrAfterWeekStart(d, weekStart);
  });

  const newClientsThisWeek = clientRows.filter((c) => {
    if (!c.accepted_at) return false;
    return parseISO(c.accepted_at) >= weekStart;
  }).length;

  const weeklyVolume = buildWeeklyVolume(sessions);
  const weeklySessions = buildWeeklySessions(sessions);

  const volumeChangePercent =
    weeklyVolume.length >= 2
      ? computePercentChange(
          weeklyVolume[weeklyVolume.length - 1].volume,
          weeklyVolume[weeklyVolume.length - 2].volume,
        )
      : null;

  const weekRpeValues = weekSessions
    .map((s) => s.rpe_average)
    .filter((v): v is number => v != null);

  const clientOverviews: ClientOverview[] = activeClientRows.map((c) => {
    const overview = buildClientOverview(
      c.client_id,
      profilesById.get(c.client_id) ?? 'Nimetön urheilija',
      sessionsByClient.get(c.client_id) ?? [],
      programContextByClient.get(c.client_id) ?? {
        assignedWorkoutCount: 0,
        scheduledThisWeek: 0,
        activeProgramName: null,
        hasAssignedProgram: false,
      },
      assignmentWorkoutByClient.get(c.client_id) ?? null,
      managedWorkoutByClient.get(c.client_id) ?? null,
      weekStart,
      prevWeekStart,
      prevWeekEnd,
      sevenDaysAgo,
    );
    const progress = progressByClient.get(c.client_id);

    return {
      ...overview,
      topExerciseName: progress?.exerciseName ?? null,
      topExerciseE1RM: progress?.currentE1RM ?? null,
      topExerciseTrend: progress?.trend ?? null,
    };
  });

  const portfolioCompliance = computePortfolioCompliance(clientOverviews);

  const clientsTrainedThisWeek = clientOverviews.filter((c) => c.trainedThisWeek).length;
  const trainingRatePercent =
    activeClientRows.length > 0
      ? Math.round((clientsTrainedThisWeek / activeClientRows.length) * 100)
      : 0;

  const stats: DashboardStats = {
    activeClients: activeClientRows.length,
    newClientsThisWeek,
    clientsTrainedThisWeek,
    trainingRatePercent,
    pendingInvites: pendingInvitations?.length ?? 0,
    sessionsThisWeek: weekSessions.length,
    sessionsPlannedThisWeek: portfolioCompliance.planned,
    compliancePercent: portfolioCompliance.compliancePercent,
    totalVolumeThisWeek: weekSessions.reduce((sum, s) => sum + (s.total_volume ?? 0), 0),
    volumeChangePercent,
    avgRpeThisWeek:
      weekRpeValues.length > 0
        ? Math.round((weekRpeValues.reduce((a, b) => a + b, 0) / weekRpeValues.length) * 10) / 10
        : null,
  };

  const attentionClients: AttentionClient[] = [];

  for (const c of clientRows) {
    const nickname = profilesById.get(c.client_id) ?? 'Nimetön urheilija';
    const clientSessions = sessionsByClient.get(c.client_id) ?? [];

    if (c.status === 'pending') {
      attentionClients.push({
        clientId: c.client_id,
        nickname,
        reason: 'pending',
        lastSessionDate: null,
        daysInactive: null,
      });
      continue;
    }

    if (c.status !== 'active') continue;

    const overview = clientOverviews.find((o) => o.clientId === c.client_id);
    if (!overview) continue;

    if (!overview.hasAssignedProgram) {
      attentionClients.push({
        clientId: c.client_id,
        nickname,
        reason: 'no_program',
        lastSessionDate: overview.lastSessionDate,
        daysInactive: null,
        detail: 'Määritä treeniohjelma asiakkaalle',
      });
    }

    if (overview.programStuck) {
      attentionClients.push({
        clientId: c.client_id,
        nickname,
        reason: 'program_stuck',
        lastSessionDate: overview.lastSessionDate,
        daysInactive: null,
        detail: overview.cycleWeek != null
          ? `Viikko ${overview.cycleWeek} ei etene`
          : 'Ohjelman viikko ei etene',
      });
    }

    if (hasClientVolumeSpike(clientSessions)) {
      const spike = getPortfolioVolumeSpike(clientSessions);
      attentionClients.push({
        clientId: c.client_id,
        nickname,
        reason: 'volume_spike',
        lastSessionDate: overview.lastSessionDate,
        daysInactive: null,
        detail: spike
          ? `Volyymi +${Math.round(spike.percentChange)} % keskiarvoon`
          : undefined,
      });
    }

    if (overview.rpeElevated) {
      attentionClients.push({
        clientId: c.client_id,
        nickname,
        reason: 'high_rpe',
        lastSessionDate: overview.lastSessionDate,
        daysInactive: null,
        detail: 'Keskim. RPE > 8.5 viimeisillä treeneillä',
      });
    }

    if (overview.status === 'inactive') {
      const daysInactive = overview.lastSessionDate
        ? differenceInDays(now, parseISO(overview.lastSessionDate))
        : null;

      attentionClients.push({
        clientId: c.client_id,
        nickname,
        reason: overview.lastSessionDate ? 'inactive' : 'no_sessions',
        lastSessionDate: overview.lastSessionDate,
        daysInactive,
      });
    }
  }

  attentionClients.sort(
    (a, b) => ATTENTION_PRIORITY[a.reason] - ATTENTION_PRIORITY[b.reason],
  );

  const portfolioSpike = getPortfolioVolumeSpike(sessions);
  const volumeSpike: VolumeSpikeAlert | null = portfolioSpike?.hasSpike
    ? {
        hasSpike: true,
        percentChange: Math.round(portfolioSpike.percentChange),
        currentVolume: portfolioSpike.currentVolume,
        avgVolume: Math.round(portfolioSpike.avgVolume),
      }
    : null;

  const newSessionIds = new Set(
    sessions
      .filter((s) => s.created_at && parseISO(s.created_at) > lastSeenAt)
      .map((s) => s.id),
  );

  const recentSlice = sessions.slice(0, 10);
  const recentSessionIds = recentSlice.map((s) => s.id);

  const exerciseCountBySession = new Map<string, number>();
  let notedSessionIds = new Set<string>();
  let athleteNoteSessionIds = new Set<string>();

  if (recentSessionIds.length > 0) {
    const [{ data: exerciseRows }, notedIds, athleteNoteIds] = await Promise.all([
      supabase
        .from('session_exercises')
        .select('session_id')
        .in('session_id', recentSessionIds),
      fetchNotedSessionIds(supabase, user.id, recentSessionIds),
      fetchAthleteNoteSessionIds(supabase, recentSessionIds),
    ]);

    for (const row of exerciseRows ?? []) {
      if (!row.session_id) continue;
      exerciseCountBySession.set(
        row.session_id,
        (exerciseCountBySession.get(row.session_id) ?? 0) + 1,
      );
    }
    notedSessionIds = notedIds;
    athleteNoteSessionIds = athleteNoteIds;
  }

  const recentSessions: CoachActivitySession[] = recentSlice.map((s) => ({
    id: s.id,
    clientId: s.user_id!,
    clientNickname: profilesById.get(s.user_id!) ?? 'Nimetön urheilija',
    date: s.date ?? '',
    duration: s.duration ?? 0,
    totalVolume: s.total_volume ?? 0,
    workoutId: s.workout_id ?? null,
    feeling: s.feeling,
    rpeAverage: s.rpe_average,
    heartRateAvg: s.heart_rate_avg,
    heartRateMax: s.heart_rate_max,
    workoutName: s.workouts?.program ?? null,
    workoutType: s.workouts?.workout_type ?? null,
    exerciseCount: exerciseCountBySession.get(s.id) ?? 0,
    hasCoachNote: notedSessionIds.has(s.id),
    hasAthleteNote: athleteNoteSessionIds.has(s.id),
    cycleWeek: s.cycle_week,
    cycleWeeks: s.workouts?.cycle_weeks ?? null,
    isNew: newSessionIds.has(s.id),
  }));

  return {
    coachName,
    stats,
    clientOverviews,
    attentionClients,
    recentSessions,
    pendingInvitations: pendingInvitations ?? [],
    weeklyVolume,
    weeklySessions,
    volumeSpike,
    recentPRs,
    hasClients: clientRows.length > 0,
  };
}
