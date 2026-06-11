import { subMonths } from 'date-fns';
import { calculateE1RM } from '@/lib/analytics';
import { mapToAnalyticsSessions } from '@/lib/client-analytics/progress';
import {
  SessionDetail as SessionDetailType,
  SessionSummary,
  CooldownData,
  WarmupData,
} from '@/types';
import {
  fetchAthleteNoteSessionIds,
  fetchNotedSessionIds,
  formatSessionSummaries,
  normalizeAthleteNote,
} from '@/lib/sessions/format';

type SupabaseClient = Awaited<
  ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>
> | ReturnType<typeof import('@/lib/supabase/client').createClient>;

export interface SessionDetailResult {
  data: SessionDetailType;
  previousBestByExercise: Record<string, number>;
}

export const SESSION_SUMMARY_LOOKBACK_MONTHS = 6;
export const SESSION_SUMMARY_LIMIT = 100;

export async function fetchClientSessionSummaries(
  supabase: SupabaseClient,
  clientId: string,
  coachId: string | null,
): Promise<SessionSummary[]> {
  const lookbackStart = subMonths(new Date(), SESSION_SUMMARY_LOOKBACK_MONTHS);

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
      notes,
      cycle_week,
      workout_id,
      workouts ( program, workout_type, cycle_weeks ),
      session_exercises (
        notes,
        session_sets ( notes )
      )
    `)
    .eq('user_id', clientId)
    .gte('date', lookbackStart.toISOString())
    .order('date', { ascending: false })
    .limit(SESSION_SUMMARY_LIMIT);

  const sessionRows = sessions ?? [];
  const sessionIds = sessionRows.map((s) => s.id);

  const [notedSessionIds, athleteNoteSessionIds] = coachId
    ? await Promise.all([
        fetchNotedSessionIds(supabase, coachId, sessionIds),
        fetchAthleteNoteSessionIds(supabase, sessionIds),
      ])
    : [new Set<string>(), new Set<string>()];

  return formatSessionSummaries(sessionRows, notedSessionIds, athleteNoteSessionIds);
}

export async function fetchSessionDetail(
  supabase: SupabaseClient,
  sessionId: string,
  clientId: string,
  coachId: string | null,
): Promise<SessionDetailResult | null> {
  const { data: sessionData, error: sessionError } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      date,
      duration,
      total_volume,
      feeling,
      rpe_average,
      notes,
      warmup,
      cooldown,
      heart_rate_avg,
      heart_rate_max,
      cycle_week,
      workout_id,
      workouts ( program, cycle_weeks )
    `)
    .eq('id', sessionId)
    .eq('user_id', clientId)
    .single();

  if (sessionError || !sessionData) return null;

  const [{ data: priorSessions }, { data: exercisesData }, noteResult] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select(`
        id,
        date,
        session_exercises (
          name,
          session_sets ( weight_used, reps_completed )
        )
      `)
      .eq('user_id', clientId)
      .lt('date', sessionData.date ?? new Date().toISOString())
      .order('date', { ascending: true }),
    supabase
      .from('session_exercises')
      .select(`
        id,
        name,
        order_index,
        notes,
        heart_rate_avg,
        heart_rate_max,
        session_sets (
          set_index,
          weight_used,
          reps_completed,
          rpe,
          rest_time_taken,
          notes,
          completed_at
        )
      `)
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true }),
    coachId
      ? supabase
          .from('coach_session_notes')
          .select('content')
          .eq('session_id', sessionId)
          .eq('coach_id', coachId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const priorAnalytics = mapToAnalyticsSessions(
    (priorSessions ?? []).map((s) => ({
      id: s.id,
      user_id: clientId,
      workout_id: null,
      date: s.date,
      duration: null,
      total_volume: null,
      rpe_average: null,
      cycle_week: null,
      is_deload: null,
      session_exercises: (s.session_exercises ?? []).map((ex) => ({
        id: '',
        name: ex.name,
        exercise_id: null,
        is_ad_hoc: null,
        is_swapped: null,
        session_sets: (ex.session_sets ?? []).map((set) => ({
          weight_used: set.weight_used,
          reps_completed: set.reps_completed,
          rpe: null,
        })),
      })),
    })),
  );

  const previousBestByExercise: Record<string, number> = {};
  for (const session of priorAnalytics) {
    for (const exercise of session.exercises) {
      const maxE1RM = Math.max(
        0,
        ...exercise.sets.map((set) => calculateE1RM(set.weight_used, set.reps_completed)),
      );
      if (maxE1RM > 0) {
        previousBestByExercise[exercise.name] = Math.max(
          previousBestByExercise[exercise.name] ?? 0,
          maxE1RM,
        );
      }
    }
  }

  type ExerciseRow = NonNullable<typeof exercisesData>[number];
  type SetRow = NonNullable<ExerciseRow['session_sets']>[number];

  const data: SessionDetailType = {
    session: {
      id: sessionData.id,
      date: sessionData.date || '',
      duration: sessionData.duration || 0,
      totalVolume: sessionData.total_volume || 0,
      feeling: sessionData.feeling,
      rpeAverage: sessionData.rpe_average,
      notes: normalizeAthleteNote(sessionData.notes),
      warmup: (sessionData.warmup as unknown as WarmupData) ?? null,
      cooldown: (sessionData.cooldown as unknown as CooldownData) ?? null,
      heartRateAvg: sessionData.heart_rate_avg,
      heartRateMax: sessionData.heart_rate_max,
      heartRateSamples: null,
      cycleWeek: sessionData.cycle_week,
      workoutName: sessionData.workouts?.program || null,
      cycleWeeks: sessionData.workouts?.cycle_weeks || null,
    },
    exercises: (exercisesData ?? []).map((ex: ExerciseRow, exerciseIndex) => ({
      id: ex.id,
      name: ex.name,
      orderIndex: ex.order_index ?? exerciseIndex,
      notes: normalizeAthleteNote(ex.notes),
      heartRateAvg: ex.heart_rate_avg,
      heartRateMax: ex.heart_rate_max,
      coachNote: null,
      sets: [...(ex.session_sets ?? [])]
        .sort((a: SetRow, b: SetRow) => (a.set_index as number) - (b.set_index as number))
        .map((set: SetRow, setIndex) => ({
          setIndex: set.set_index ?? setIndex,
          weightUsed: set.weight_used,
          repsCompleted: set.reps_completed,
          rpe: set.rpe,
          restTimeTaken: set.rest_time_taken,
          notes: normalizeAthleteNote(set.notes),
          completedAt: set.completed_at,
        })),
    })),
    coachNote: noteResult.data?.content || null,
  };

  return { data, previousBestByExercise };
}
