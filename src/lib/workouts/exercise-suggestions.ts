import { parseISO } from 'date-fns';
import { ExerciseOption } from '@/lib/sessions/exercise-history';
import {
  ApplyExerciseFromHistoryPayload,
  ApplyWorkoutFromHistoryPayload,
  TargetType,
} from '@/lib/types/workout';

type SupabaseClient = Awaited<
  ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>
> | ReturnType<typeof import('@/lib/supabase/client').createClient>;

function normalizeExerciseKey(name: string): string {
  return name.trim().toLowerCase();
}

export async function fetchCoachExerciseNameOptions(
  supabase: SupabaseClient,
  coachId: string,
): Promise<ExerciseOption[]> {
  const { data } = await supabase
    .from('exercises')
    .select(`
      name,
      workouts!inner (
        date,
        user_id
      )
    `)
    .eq('workouts.user_id', coachId);

  const byKey = new Map<string, { name: string; usageCount: number; lastDate: string }>();

  for (const row of data ?? []) {
    const workout = row.workouts as { date?: string | null; user_id?: string } | null;
    if (!row.name?.trim() || !workout?.date) continue;

    const key = normalizeExerciseKey(row.name);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, {
        name: row.name.trim(),
        usageCount: 1,
        lastDate: workout.date,
      });
      continue;
    }

    existing.usageCount += 1;
    if (parseISO(workout.date).getTime() > parseISO(existing.lastDate).getTime()) {
      existing.lastDate = workout.date;
      existing.name = row.name.trim();
    }
  }

  return [...byKey.values()]
    .map((entry) => ({
      name: entry.name,
      sessionCount: entry.usageCount,
      lastDate: entry.lastDate,
    }))
    .sort((a, b) => parseISO(b.lastDate).getTime() - parseISO(a.lastDate).getTime());
}

export async function fetchLatestPlannedSets(
  supabase: SupabaseClient,
  coachId: string,
  exerciseName: string,
): Promise<ApplyExerciseFromHistoryPayload['sets'] | null> {
  const key = normalizeExerciseKey(exerciseName);

  const { data } = await supabase
    .from('exercises')
    .select(`
      name,
      workouts!inner ( date, user_id ),
      exercise_sets (
        reps,
        weight,
        rest_time,
        rpe,
        target_type,
        is_bodyweight,
        cycle_week
      )
    `)
    .eq('workouts.user_id', coachId);

  type Row = {
    name: string;
    workouts: { date: string | null } | null;
    exercise_sets: Array<{
      reps: number | null;
      weight: number | null;
      rest_time: number | null;
      rpe: number | null;
      target_type: string | null;
      is_bodyweight: boolean | null;
      cycle_week: number | null;
    }> | null;
  };

  const matching = ((data ?? []) as Row[]).filter(
    (row) => row.name && normalizeExerciseKey(row.name) === key,
  );

  if (matching.length === 0) return null;

  const latest = matching.sort(
    (a, b) =>
      parseISO(b.workouts?.date ?? '1970-01-01').getTime() -
      parseISO(a.workouts?.date ?? '1970-01-01').getTime(),
  )[0];

  const weekOneSets = [...(latest.exercise_sets ?? [])]
    .filter((s) => (s.cycle_week ?? 1) === 1)
    .sort((a, b) => (a.cycle_week ?? 1) - (b.cycle_week ?? 1));

  const setsToMap = weekOneSets.length > 0 ? weekOneSets : latest.exercise_sets ?? [];
  if (setsToMap.length === 0) return null;

  return setsToMap.map((s) => ({
    reps: s.reps?.toString() || '',
    weight: s.is_bodyweight ? '' : s.weight?.toString() || '',
    restTime: s.rest_time?.toString() || '60',
    targetRpe: s.rpe?.toString() || '',
    targetType: (s.target_type as TargetType) || 'reps',
    isBodyweight: Boolean(s.is_bodyweight),
  }));
}

export async function fetchWorkoutBlankStructure(
  supabase: SupabaseClient,
  workoutId: string,
): Promise<ApplyWorkoutFromHistoryPayload | null> {
  const { data: workout, error } = await supabase
    .from('workouts')
    .select(`
      exercises (
        name,
        order_index,
        exercise_sets (
          reps,
          weight,
          rest_time,
          rpe,
          target_type,
          is_bodyweight,
          cycle_week
        )
      )
    `)
    .eq('id', workoutId)
    .single();

  if (error || !workout?.exercises?.length) return null;

  type ExerciseRow = {
    name: string | null;
    order_index: number | null;
    exercise_sets: Array<{ cycle_week: number | null }> | null;
  };

  const sorted = [...(workout.exercises as ExerciseRow[])].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
  );

  const exercises = sorted.map((ex) => {
    const weekOneSets = [...(ex.exercise_sets ?? [])].filter(
      (s) => (s.cycle_week ?? 1) === 1,
    );
    const setsSource = weekOneSets.length > 0 ? weekOneSets : ex.exercise_sets ?? [];

    const sets =
      setsSource.length > 0
        ? setsSource.map(() => ({
            reps: '',
            weight: '',
            restTime: '60',
            targetRpe: '',
            targetType: 'reps' as TargetType,
            isBodyweight: false,
          }))
        : [{ reps: '', weight: '', restTime: '60' }];

    return {
      name: ex.name?.trim() || 'Nimetön liike',
      sets,
    };
  });

  return { exercises };
}
