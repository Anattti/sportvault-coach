import {
  ApplyExerciseFromHistoryPayload,
  SetBlock,
  TargetType,
} from '@/lib/types/workout';

export function buildSetBlocksForExercise(
  sets: ApplyExerciseFromHistoryPayload['sets'],
  cycleWeeks: number,
  activeCycleWeek: number,
): SetBlock[] {
  const buildSetsForWeek = (week: number, usePayload: boolean): SetBlock[] => {
    if (usePayload && sets.length > 0) {
      return sets.map((s) => ({
        id: Math.random().toString(),
        reps: s.reps,
        weight: s.weight,
        restTime: s.restTime || '60',
        targetRpe: s.targetRpe || '',
        targetType: s.targetType || 'reps',
        isBodyweight: s.isBodyweight || false,
        cycleWeek: week,
        notes: '',
      }));
    }
    return [
      {
        id: Math.random().toString(),
        reps: '',
        weight: '',
        restTime: '60',
        targetType: 'reps' as TargetType,
        isBodyweight: false,
        cycleWeek: week,
        notes: '',
      },
    ];
  };

  const allSets: SetBlock[] = [];
  for (let w = 1; w <= cycleWeeks; w++) {
    allSets.push(...buildSetsForWeek(w, w === activeCycleWeek));
  }
  return allSets;
}

export function createEmptyExerciseSetBlocks(cycleWeeks: number): SetBlock[] {
  const allSets: SetBlock[] = [];
  for (let w = 1; w <= cycleWeeks; w++) {
    allSets.push({
      id: Math.random().toString(),
      reps: '',
      weight: '',
      restTime: '60',
      targetType: 'reps',
      isBodyweight: false,
      cycleWeek: w,
      notes: '',
    });
  }
  return allSets;
}
