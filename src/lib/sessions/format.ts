import { SessionSummary } from '@/types';

type SessionExerciseRow =
  | {
      id?: string;
      notes?: string | null;
      session_sets?: Array<{ notes?: string | null; [key: string]: unknown }> | null;
    }
  | { count: number };

type RawSessionRow = {
  id: string;
  date: string | null;
  duration: number | null;
  total_volume: number | null;
  feeling?: number | null;
  rpe_average: number | null;
  heart_rate_avg?: number | null;
  heart_rate_max?: number | null;
  notes?: string | null;
  workout_id?: string | null;
  cycle_week?: number | null;
  workouts?: {
    program: string | null;
    workout_type: string | null;
    cycle_weeks?: number | null;
  } | null;
  session_exercises?: SessionExerciseRow[] | null;
};

export function normalizeAthleteNote(notes: unknown): string | null {
  if (typeof notes !== 'string') return null;
  const trimmed = notes.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function hasAthleteSessionNote(notes: string | null | undefined): boolean {
  return normalizeAthleteNote(notes) != null;
}

function exerciseHasAthleteNote(
  exercise: { notes?: string | null; session_sets?: Array<{ notes?: string | null }> | null },
): boolean {
  if (hasAthleteSessionNote(exercise.notes)) return true;
  return (exercise.session_sets ?? []).some((set) => hasAthleteSessionNote(set.notes));
}

export function sessionHasAthleteNote(session: RawSessionRow): boolean {
  if (hasAthleteSessionNote(session.notes)) return true;

  for (const exercise of session.session_exercises ?? []) {
    if ('count' in exercise) continue;
    if (exerciseHasAthleteNote(exercise)) return true;
  }

  return false;
}

function countExercises(exercises: SessionExerciseRow[] | null | undefined): number {
  if (!exercises?.length) return 0;
  const first = exercises[0];
  if ('count' in first && typeof first.count === 'number') return first.count;
  return exercises.length;
}

export function formatSessionSummary(
  session: RawSessionRow,
  notedSessionIds: Set<string> = new Set(),
  athleteNoteSessionIds?: Set<string>,
): SessionSummary {
  return {
    id: session.id,
    date: session.date ?? '',
    duration: session.duration ?? 0,
    totalVolume: session.total_volume ?? 0,
    workoutId: session.workout_id ?? null,
    feeling: session.feeling ?? null,
    rpeAverage: session.rpe_average,
    heartRateAvg: session.heart_rate_avg ?? null,
    heartRateMax: session.heart_rate_max ?? null,
    workoutName: session.workouts?.program ?? null,
    workoutType: session.workouts?.workout_type ?? null,
    exerciseCount: countExercises(session.session_exercises),
    hasCoachNote: notedSessionIds.has(session.id),
    hasAthleteNote: athleteNoteSessionIds
      ? athleteNoteSessionIds.has(session.id)
      : sessionHasAthleteNote(session),
    cycleWeek: session.cycle_week ?? null,
    cycleWeeks: session.workouts?.cycle_weeks ?? null,
  };
}

export function formatCycleWeekLabel(
  cycleWeek: number | null,
  cycleWeeks: number | null,
): string | null {
  if (cycleWeek == null || cycleWeeks == null || cycleWeeks <= 0) return null;
  return `${cycleWeek}/${cycleWeeks}`;
}

export function formatSessionSummaries(
  sessions: RawSessionRow[],
  notedSessionIds: Set<string> = new Set(),
  athleteNoteSessionIds?: Set<string>,
): SessionSummary[] {
  return sessions.map((session) =>
    formatSessionSummary(session, notedSessionIds, athleteNoteSessionIds),
  );
}

export async function fetchAthleteNoteSessionIds(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>>,
  sessionIds: string[],
): Promise<Set<string>> {
  if (sessionIds.length === 0) return new Set();

  const result = new Set<string>();

  const [{ data: sessionsWithNotes }, { data: exercisesWithNotes }, { data: exercises }] =
    await Promise.all([
      supabase.from('workout_sessions').select('id, notes').in('id', sessionIds),
      supabase
        .from('session_exercises')
        .select('session_id, notes')
        .in('session_id', sessionIds)
        .not('notes', 'is', null),
      supabase.from('session_exercises').select('id, session_id').in('session_id', sessionIds),
    ]);

  for (const row of sessionsWithNotes ?? []) {
    if (hasAthleteSessionNote(row.notes)) {
      result.add(row.id);
    }
  }

  for (const row of exercisesWithNotes ?? []) {
    if (row.session_id && hasAthleteSessionNote(row.notes)) {
      result.add(row.session_id);
    }
  }

  const exerciseIds = (exercises ?? []).map((row) => row.id);
  const sessionIdByExercise = new Map(
    (exercises ?? []).map((row) => [row.id, row.session_id] as const),
  );

  if (exerciseIds.length > 0) {
    const { data: setsWithNotes } = await supabase
      .from('session_sets')
      .select('session_exercise_id, notes')
      .in('session_exercise_id', exerciseIds)
      .not('notes', 'is', null);

    for (const row of setsWithNotes ?? []) {
      if (!row.session_exercise_id || !hasAthleteSessionNote(row.notes)) continue;
      const sessionId = sessionIdByExercise.get(row.session_exercise_id);
      if (sessionId) result.add(sessionId);
    }
  }

  return result;
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

export function enrichWithSessionNoteFlags<T extends { sessionId: string }>(
  records: T[],
  athleteNoteSessionIds: Set<string>,
  coachNoteSessionIds: Set<string>,
): Array<T & { hasAthleteNote: boolean; hasCoachNote: boolean }> {
  return records.map((record) => ({
    ...record,
    hasAthleteNote: athleteNoteSessionIds.has(record.sessionId),
    hasCoachNote: coachNoteSessionIds.has(record.sessionId),
  }));
}
