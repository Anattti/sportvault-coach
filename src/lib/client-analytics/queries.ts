import { subWeeks } from 'date-fns';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  buildProgramContextMap,
  getCurrentWeekBounds,
  isDateInCurrentWeek,
} from '@/lib/dashboard/compliance';
import { ClientAnalyticsData } from '@/types';
import { buildAdherenceSummary } from './adherence';
import {
  buildComplianceHistory,
  buildCycleProgress,
  buildScheduledByWeek,
  computeTrainingStreak,
  getThisWeekCompliance,
  isClientProgramStuck,
} from './compliance-history';
import { buildLoadMetrics, computeVolumeChangePercent } from './load';
import {
  buildExerciseProgressTable,
  findAllPersonalRecords,
  getPeriodBounds,
  mapToAnalyticsSessions,
} from './progress';
import { buildDevelopmentSummary } from './summary';
import { ClientSessionRow, PrescriptionExerciseRow } from './types';

export interface GetClientAnalyticsOptions {
  periodWeeks?: number;
}

export async function getClientAnalytics(
  clientId: string,
  coachId: string,
  options: GetClientAnalyticsOptions = {},
): Promise<ClientAnalyticsData | null> {
  const periodWeeks = options.periodWeeks ?? 8;
  const supabase = await createServerSupabaseClient();
  const now = new Date();
  const lookbackStart = subWeeks(now, 52);

  const { weekStart: currentWeekStart, weekEnd: currentWeekEnd } = getCurrentWeekBounds(now);

  const [
    { data: sessionData },
    { data: assignments },
    { data: managedWorkouts },
    { data: scheduledWorkouts },
  ] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select(`
        id,
        user_id,
        workout_id,
        date,
        duration,
        total_volume,
        rpe_average,
        cycle_week,
        is_deload,
        workouts ( workout_type ),
        session_exercises (
          id,
          name,
          exercise_id,
          is_ad_hoc,
          is_swapped,
          session_sets (
            weight_used,
            reps_completed,
            rpe
          )
        )
      `)
      .eq('user_id', clientId)
      .gte('date', lookbackStart.toISOString())
      .order('date', { ascending: true }),
    supabase
      .from('coach_program_assignments')
      .select(`
        client_id,
        workout_id,
        workouts ( program )
      `)
      .eq('coach_id', coachId)
      .eq('client_id', clientId)
      .order('assigned_at', { ascending: false }),
    supabase
      .from('workouts')
      .select('id, user_id, program')
      .eq('user_id', clientId)
      .eq('managed_by_coach', true),
    supabase
      .from('scheduled_workouts')
      .select('scheduled_date, status')
      .eq('user_id', clientId)
      .gte('scheduled_date', subWeeks(now, periodWeeks).toISOString().slice(0, 10)),
  ]);

  const sessionRows = (sessionData ?? []) as ClientSessionRow[];
  const analyticsSessions = mapToAnalyticsSessions(sessionRows);

  const scheduledThisWeekByClient = new Map<string, number>();
  for (const row of scheduledWorkouts ?? []) {
    if (row.status === 'cancelled') continue;
    if (!isDateInCurrentWeek(row.scheduled_date, currentWeekStart, currentWeekEnd)) continue;
    scheduledThisWeekByClient.set(clientId, (scheduledThisWeekByClient.get(clientId) ?? 0) + 1);
  }

  const programContext = buildProgramContextMap(
    [clientId],
    (assignments ?? []) as Array<{
      client_id: string;
      workout_id: string;
      workouts: { program: string | null } | null;
    }>,
    managedWorkouts ?? [],
    scheduledThisWeekByClient,
  ).get(clientId) ?? {
    assignedWorkoutCount: 0,
    scheduledThisWeek: 0,
    activeProgramName: null,
    hasAssignedProgram: false,
  };

  const { currentStart } = getPeriodBounds(periodWeeks, now);
  const exerciseProgress = buildExerciseProgressTable(analyticsSessions, periodWeeks);
  const personalRecords = findAllPersonalRecords(analyticsSessions, currentStart);
  const volumeChangePercent = computeVolumeChangePercent(sessionRows, periodWeeks);
  const compliancePercent = getThisWeekCompliance(
    sessionRows,
    programContext.scheduledThisWeek,
    programContext.assignedWorkoutCount,
  );

  const summary = buildDevelopmentSummary(
    exerciseProgress,
    volumeChangePercent,
    personalRecords.length,
    compliancePercent,
    periodWeeks,
  );

  const load = buildLoadMetrics(sessionRows, periodWeeks);
  const scheduledByWeek = buildScheduledByWeek(scheduledWorkouts ?? [], periodWeeks);
  const complianceHistory = buildComplianceHistory(
    sessionRows,
    scheduledByWeek,
    programContext.assignedWorkoutCount,
    periodWeeks,
  );
  const cycleProgress = buildCycleProgress(sessionRows);
  const trainingStreakWeeks = computeTrainingStreak(complianceHistory);
  const programStuck = isClientProgramStuck(sessionRows);

  const workoutIds = [
    ...new Set(sessionRows.map((s) => s.workout_id).filter(Boolean) as string[]),
  ];

  let prescriptionsByWorkoutId = new Map<string, PrescriptionExerciseRow[]>();

  if (workoutIds.length > 0) {
    const { data: prescriptionData } = await supabase
      .from('exercises')
      .select(`
        id,
        name,
        workout_id,
        exercise_sets (
          cycle_week,
          weight,
          reps,
          sets,
          rpe
        )
      `)
      .in('workout_id', workoutIds);

    for (const exercise of prescriptionData ?? []) {
      const workoutId = exercise.workout_id;
      const list = prescriptionsByWorkoutId.get(workoutId) ?? [];
      list.push({
        id: exercise.id,
        name: exercise.name,
        exercise_sets: exercise.exercise_sets,
      });
      prescriptionsByWorkoutId.set(workoutId, list);
    }
  }

  const adherence = buildAdherenceSummary(sessionRows, prescriptionsByWorkoutId);

  const workoutTypeCounts: Record<string, number> = {};
  for (const row of sessionRows) {
    const type = row.workouts?.workout_type;
    if (type) workoutTypeCounts[type] = (workoutTypeCounts[type] ?? 0) + 1;
  }
  const primaryWorkoutType =
    Object.entries(workoutTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    periodWeeks,
    hasSessions: sessionRows.length > 0,
    primaryWorkoutType,
    summary,
    exerciseProgress,
    personalRecords,
    load,
    complianceHistory,
    cycleProgress,
    trainingStreakWeeks,
    programStuck,
    adherence,
  };
}
