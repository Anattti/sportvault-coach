import { parseISO } from 'date-fns';
import { calculateE1RM } from '@/lib/analytics';
import {
  fetchAthleteNoteSessionIds,
  fetchNotedSessionIds,
  normalizeAthleteNote,
} from '@/lib/sessions/format';
import { resolveDisplaySetIndex } from '@/lib/sessions/workout-history';

type SupabaseClient = Awaited<
  ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>
> | ReturnType<typeof import('@/lib/supabase/client').createClient>;

export interface ExerciseOption {
  name: string;
  sessionCount: number;
  lastDate: string;
}

export interface ExerciseSessionSetRow {
  displaySetIndex: number;
  weightUsed: number | null;
  repsCompleted: number | null;
  rpe: number | null;
  e1rm: number | null;
}

export interface ExerciseSessionBlock {
  sessionId: string;
  date: string;
  workoutName: string | null;
  workoutId: string | null;
  cycleWeek: number | null;
  cycleWeeks: number | null;
  hasAthleteNote: boolean;
  hasCoachNote: boolean;
  sets: ExerciseSessionSetRow[];
  bestE1rm: number | null;
}

export interface ExerciseSessionHistoryData {
  exerciseName: string;
  sessions: ExerciseSessionBlock[];
  bestE1rm: number | null;
}

type RawExerciseRow = {
  id: string;
  name: string;
  notes: string | null;
  session_id: string;
  workout_sessions: {
    id: string;
    date: string | null;
    cycle_week: number | null;
    workout_id: string | null;
    notes: string | null;
    workouts: { program: string | null; cycle_weeks: number | null } | null;
    session_exercises?: Array<{ notes?: string | null; session_sets?: Array<{ notes?: string | null }> | null }> | null;
  } | null;
  session_sets: Array<{
    set_index: number;
    weight_used: number | null;
    reps_completed: number | null;
    rpe: number | null;
    notes: string | null;
  }> | null;
};

function normalizeExerciseKey(name: string): string {
  return name.trim().toLowerCase();
}

export async function fetchClientExerciseOptions(
  supabase: SupabaseClient,
  clientId: string,
): Promise<ExerciseOption[]> {
  const { data } = await supabase
    .from('session_exercises')
    .select(`
      name,
      session_id,
      workout_sessions!inner (
        date,
        user_id
      )
    `)
    .eq('workout_sessions.user_id', clientId);

  const byKey = new Map<
    string,
    { name: string; sessionIds: Set<string>; lastDate: string }
  >();

  for (const row of data ?? []) {
    const session = row.workout_sessions;
    if (!session?.date || !row.name?.trim() || !row.session_id) continue;

    const key = normalizeExerciseKey(row.name);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, {
        name: row.name.trim(),
        sessionIds: new Set([row.session_id]),
        lastDate: session.date,
      });
      continue;
    }

    existing.sessionIds.add(row.session_id);
    if (parseISO(session.date).getTime() > parseISO(existing.lastDate).getTime()) {
      existing.lastDate = session.date;
      existing.name = row.name.trim();
    }
  }

  return [...byKey.values()]
    .map((entry) => ({
      name: entry.name,
      sessionCount: entry.sessionIds.size,
      lastDate: entry.lastDate,
    }))
    .sort((a, b) => parseISO(b.lastDate).getTime() - parseISO(a.lastDate).getTime());
}

export async function fetchExerciseSessionHistory(
  supabase: SupabaseClient,
  clientId: string,
  coachId: string | null,
  exerciseName: string,
): Promise<ExerciseSessionHistoryData | null> {
  const key = normalizeExerciseKey(exerciseName);

  const { data } = await supabase
    .from('session_exercises')
    .select(`
      id,
      name,
      notes,
      session_id,
      workout_sessions!inner (
        id,
        date,
        cycle_week,
        workout_id,
        notes,
        user_id,
        workouts ( program, cycle_weeks ),
        session_exercises (
          notes,
          session_sets ( notes )
        )
      ),
      session_sets (
        set_index,
        weight_used,
        reps_completed,
        rpe,
        notes
      )
    `)
    .eq('workout_sessions.user_id', clientId);

  const matching = (data ?? []).filter(
    (row) => row.name && normalizeExerciseKey(row.name) === key,
  ) as RawExerciseRow[];

  if (matching.length === 0) return null;

  const sessionIds = [...new Set(matching.map((row) => row.session_id))];
  const [notedSessionIds, athleteNoteSessionIds] = coachId
    ? await Promise.all([
        fetchNotedSessionIds(supabase, coachId, sessionIds),
        fetchAthleteNoteSessionIds(supabase, sessionIds),
      ])
    : [new Set<string>(), new Set<string>()];

  const seenSessionIds = new Set<string>();
  const sessions: ExerciseSessionBlock[] = matching
    .filter((row) => {
      if (seenSessionIds.has(row.session_id)) return false;
      seenSessionIds.add(row.session_id);
      return true;
    })
    .map((row) => {
      const session = row.workout_sessions;
      if (!session?.date) return null;

      const sets = [...(row.session_sets ?? [])].sort(
        (a, b) => (a.set_index ?? 0) - (b.set_index ?? 0),
      );

      const setRows: ExerciseSessionSetRow[] = sets.map((set, index) => {
        const e1rm =
          set.weight_used != null && set.reps_completed != null
            ? calculateE1RM(set.weight_used, set.reps_completed)
            : null;
        return {
          displaySetIndex: resolveDisplaySetIndex(sets, index),
          weightUsed: set.weight_used,
          repsCompleted: set.reps_completed,
          rpe: set.rpe,
          e1rm: e1rm && e1rm > 0 ? e1rm : null,
        };
      });

      const bestE1rm = setRows.reduce<number | null>((best, set) => {
        if (set.e1rm == null) return best;
        return best == null ? set.e1rm : Math.max(best, set.e1rm);
      }, null);

      const hasExerciseNote = normalizeAthleteNote(row.notes) != null;
      const hasSetNote = sets.some((set) => normalizeAthleteNote(set.notes) != null);

      return {
        sessionId: row.session_id,
        date: session.date,
        workoutName: session.workouts?.program ?? null,
        workoutId: session.workout_id,
        cycleWeek: session.cycle_week,
        cycleWeeks: session.workouts?.cycle_weeks ?? null,
        hasAthleteNote:
          athleteNoteSessionIds.has(row.session_id) || hasExerciseNote || hasSetNote,
        hasCoachNote: notedSessionIds.has(row.session_id),
        sets: setRows,
        bestE1rm,
      };
    })
    .filter((block): block is ExerciseSessionBlock => block != null)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const displayName = matching[0]?.name?.trim() ?? exerciseName;
  const bestE1rm = sessions.reduce<number | null>((best, session) => {
    if (session.bestE1rm == null) return best;
    return best == null ? session.bestE1rm : Math.max(best, session.bestE1rm);
  }, null);

  return {
    exerciseName: displayName,
    sessions,
    bestE1rm,
  };
}
