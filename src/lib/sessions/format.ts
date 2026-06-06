import { SessionSummary } from '@/types';

type SessionExerciseRow = { id: string } | { count: number };

type RawSessionRow = {
  id: string;
  date: string | null;
  duration: number | null;
  total_volume: number | null;
  feeling: number | null;
  rpe_average: number | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  workouts?: { program: string | null; workout_type: string | null } | null;
  session_exercises?: SessionExerciseRow[] | null;
};

function countExercises(exercises: SessionExerciseRow[] | null | undefined): number {
  if (!exercises?.length) return 0;
  const first = exercises[0];
  if ('count' in first && typeof first.count === 'number') return first.count;
  return exercises.length;
}

export function formatSessionSummary(
  session: RawSessionRow,
  notedSessionIds: Set<string> = new Set(),
): SessionSummary {
  return {
    id: session.id,
    date: session.date ?? '',
    duration: session.duration ?? 0,
    totalVolume: session.total_volume ?? 0,
    feeling: session.feeling,
    rpeAverage: session.rpe_average,
    heartRateAvg: session.heart_rate_avg,
    heartRateMax: session.heart_rate_max,
    workoutName: session.workouts?.program ?? null,
    workoutType: session.workouts?.workout_type ?? null,
    exerciseCount: countExercises(session.session_exercises),
    hasCoachNote: notedSessionIds.has(session.id),
  };
}

export function formatSessionSummaries(
  sessions: RawSessionRow[],
  notedSessionIds: Set<string> = new Set(),
): SessionSummary[] {
  return sessions.map((session) => formatSessionSummary(session, notedSessionIds));
}

export async function fetchNotedSessionIds(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>>,
  coachId: string,
  sessionIds: string[],
): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set();

  const { data } = await supabase
    .from('coach_session_notes')
    .select('session_id')
    .eq('coach_id', coachId)
    .in('session_id', sessionIds);

  return new Set((data ?? []).map((row) => row.session_id));
}
