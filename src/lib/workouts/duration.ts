type SetDurationRow = {
  exercise_id: string;
  cycle_week: number;
  reps: number;
  rest_time: number;
  target_type: string | null;
  sets?: number | null;
};

const WORK_SECONDS_PER_REP = 3;
const EXERCISE_TRANSITION_SECONDS = 90;

export function estimateSetWorkSeconds(set: {
  reps: number;
  target_type: string | null;
}): number {
  const targetType = set.target_type ?? 'reps';
  if (targetType === 'seconds') return Math.max(set.reps, 10);
  if (targetType === 'meters') return 60;
  return Math.max(set.reps * WORK_SECONDS_PER_REP, 30);
}

export function estimateSetDurationSeconds(set: {
  reps: number;
  rest_time: number;
  target_type: string | null;
  sets?: number | null;
}): number {
  const count = set.sets ?? 1;
  const work = estimateSetWorkSeconds(set);
  return count * (work + (set.rest_time ?? 60));
}

export function computeAverageWorkoutDurationSeconds(
  setRows: SetDurationRow[],
  cycleWeeks: number,
): number | null {
  if (setRows.length === 0) return null;

  const weekTotals = new Map<number, number>();
  const weekExercises = new Map<number, Set<string>>();

  for (const set of setRows) {
    const week = set.cycle_week ?? 1;
    if (week > cycleWeeks) continue;

    weekTotals.set(week, (weekTotals.get(week) ?? 0) + estimateSetDurationSeconds(set));

    if (!weekExercises.has(week)) weekExercises.set(week, new Set());
    weekExercises.get(week)!.add(set.exercise_id);
  }

  for (const [week, exercises] of weekExercises) {
    const transitions = Math.max(0, exercises.size - 1) * EXERCISE_TRANSITION_SECONDS;
    weekTotals.set(week, (weekTotals.get(week) ?? 0) + transitions);
  }

  const weekDurations = [...weekTotals.values()];
  if (weekDurations.length === 0) return null;

  return Math.round(weekDurations.reduce((sum, value) => sum + value, 0) / weekDurations.length);
}

export function formatWorkoutDurationMinutes(totalSeconds: number | null | undefined): string {
  if (totalSeconds == null || totalSeconds <= 0) return '—';
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `${minutes} min`;
}

type WorkoutDurationInput = {
  id: string;
  cycle_weeks: number | null;
  duration: number | null;
};

export async function fetchAverageWorkoutDurations(
  supabase: Awaited<
    ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>
  >,
  workouts: WorkoutDurationInput[],
): Promise<Map<string, number>> {
  const workoutIds = workouts.map((workout) => workout.id);
  if (workoutIds.length === 0) return new Map();

  const result = new Map<string, number>();

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select('workout_id, duration')
    .in('workout_id', workoutIds)
    .not('duration', 'is', null);

  const sessionDurations = new Map<string, number[]>();
  for (const session of sessions ?? []) {
    if (!session.workout_id || session.duration == null || session.duration <= 0) continue;
    const list = sessionDurations.get(session.workout_id) ?? [];
    list.push(session.duration);
    sessionDurations.set(session.workout_id, list);
  }

  for (const [workoutId, durations] of sessionDurations) {
    result.set(
      workoutId,
      Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length),
    );
  }

  const missingIds = workoutIds.filter((id) => !result.has(id));
  if (missingIds.length > 0) {
    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, workout_id')
      .in('workout_id', missingIds);

    const exerciseIds = (exercises ?? []).map((exercise) => exercise.id);
    const workoutIdByExercise = new Map(
      (exercises ?? []).map((exercise) => [exercise.id, exercise.workout_id] as const),
    );

    if (exerciseIds.length > 0) {
      const { data: setRows } = await supabase
        .from('exercise_sets')
        .select('exercise_id, cycle_week, reps, rest_time, target_type, sets')
        .in('exercise_id', exerciseIds);

      const setsByWorkout = new Map<string, SetDurationRow[]>();
      for (const set of setRows ?? []) {
        const workoutId = workoutIdByExercise.get(set.exercise_id);
        if (!workoutId) continue;
        const list = setsByWorkout.get(workoutId) ?? [];
        list.push(set);
        setsByWorkout.set(workoutId, list);
      }

      for (const workout of workouts) {
        if (result.has(workout.id)) continue;
        const sets = setsByWorkout.get(workout.id) ?? [];
        const estimated = computeAverageWorkoutDurationSeconds(
          sets,
          workout.cycle_weeks ?? 1,
        );
        if (estimated != null && estimated > 0) {
          result.set(workout.id, estimated);
        }
      }
    }
  }

  for (const workout of workouts) {
    if (!result.has(workout.id) && workout.duration != null && workout.duration > 0) {
      result.set(workout.id, workout.duration);
    }
  }

  return result;
}
