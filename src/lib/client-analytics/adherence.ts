import { calculateE1RM } from '@/lib/analytics';
import { AdherenceSummary } from '@/types';
import { ClientSessionRow, PrescriptionExerciseRow } from './types';

type PrescriptionMap = Map<
  string,
  Map<number, Array<{ weight: number; reps: number; sets: number; rpe: number | null }>>
>;

function buildPrescriptionMap(exercises: PrescriptionExerciseRow[]): PrescriptionMap {
  const map: PrescriptionMap = new Map();

  for (const exercise of exercises) {
    const weekMap = new Map<
      number,
      Array<{ weight: number; reps: number; sets: number; rpe: number | null }>
    >();

    for (const set of exercise.exercise_sets ?? []) {
      const week = set.cycle_week;
      const list = weekMap.get(week) ?? [];
      list.push({
        weight: set.weight,
        reps: set.reps,
        sets: set.sets,
        rpe: set.rpe,
      });
      weekMap.set(week, list);
    }

    map.set(exercise.id, weekMap);
  }

  return map;
}

export function buildAdherenceSummary(
  sessionRows: ClientSessionRow[],
  prescriptionsByWorkoutId: Map<string, PrescriptionExerciseRow[]>,
): AdherenceSummary {
  const linkedSessions = sessionRows.filter((s) => s.workout_id);

  if (linkedSessions.length === 0) {
    return emptyAdherence();
  }

  let totalPrescribedSets = 0;
  let totalCompletedSets = 0;
  let weightDeviations: number[] = [];
  let repsDeviations: number[] = [];
  let rpeDeviations: number[] = [];
  let totalExercises = 0;
  let swappedCount = 0;
  let adHocCount = 0;

  for (const session of linkedSessions) {
    const prescription = prescriptionsByWorkoutId.get(session.workout_id!);
    if (!prescription) continue;

    const prescriptionMap = buildPrescriptionMap(prescription);
    const cycleWeek = session.cycle_week ?? 1;

    for (const exercise of session.session_exercises ?? []) {
      totalExercises++;
      if (exercise.is_swapped) swappedCount++;
      if (exercise.is_ad_hoc) adHocCount++;

      const completedSets = (exercise.session_sets ?? []).filter(
        (s) => (s.reps_completed ?? 0) > 0,
      );
      totalCompletedSets += completedSets.length;

      if (!exercise.exercise_id) continue;

      const weekPrescription = prescriptionMap.get(exercise.exercise_id)?.get(cycleWeek);
      if (!weekPrescription?.length) continue;

      const prescribedSetCount = weekPrescription.reduce((sum, b) => sum + b.sets, 0);
      totalPrescribedSets += prescribedSetCount;

      const target = weekPrescription[0];
      for (const set of completedSets) {
        if (target.weight > 0 && set.weight_used != null && set.weight_used > 0) {
          weightDeviations.push(
            ((set.weight_used - target.weight) / target.weight) * 100,
          );
        }
        if (target.reps > 0 && set.reps_completed != null) {
          repsDeviations.push(set.reps_completed - target.reps);
        }
        if (target.rpe != null && set.rpe != null) {
          rpeDeviations.push(set.rpe - target.rpe);
        }
      }
    }
  }

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

  return {
    setCompletionPercent:
      totalPrescribedSets > 0
        ? Math.min(100, Math.round((totalCompletedSets / totalPrescribedSets) * 100))
        : null,
    avgWeightDeviationPercent: avg(weightDeviations),
    avgRepsDeviation: avg(repsDeviations),
    avgRpeDeviation: avg(rpeDeviations),
    swapPercent:
      totalExercises > 0 ? Math.round((swappedCount / totalExercises) * 100) : null,
    adHocPercent:
      totalExercises > 0 ? Math.round((adHocCount / totalExercises) * 100) : null,
    sessionsAnalyzed: linkedSessions.length,
  };
}

function emptyAdherence(): AdherenceSummary {
  return {
    setCompletionPercent: null,
    avgWeightDeviationPercent: null,
    avgRepsDeviation: null,
    avgRpeDeviation: null,
    swapPercent: null,
    adHocPercent: null,
    sessionsAnalyzed: 0,
  };
}

export function computeSessionExerciseE1RM(
  sets: Array<{ weightUsed: number | null; repsCompleted: number | null }>,
): number {
  const values = sets
    .filter((s) => (s.weightUsed ?? 0) > 0 && (s.repsCompleted ?? 0) > 0)
    .map((s) => calculateE1RM(s.weightUsed!, s.repsCompleted!));
  return values.length > 0 ? Math.max(...values) : 0;
}
