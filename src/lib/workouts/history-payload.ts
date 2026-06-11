import { ExerciseSessionBlock } from '@/lib/sessions/exercise-history';
import {
  ApplyExerciseFromHistoryPayload,
  ApplyWorkoutFromHistoryPayload,
} from '@/lib/types/workout';
import { WorkoutExerciseHistory, WorkoutHistoryData } from '@/types';

export function buildExercisePayloadFromSession(
  exerciseName: string,
  session: ExerciseSessionBlock,
): ApplyExerciseFromHistoryPayload {
  return {
    name: exerciseName,
    sets: session.sets.map((s) => ({
      weight: s.weightUsed?.toString() || '',
      reps: s.repsCompleted?.toString() || '',
      targetRpe: s.rpe?.toString() || '',
    })),
  };
}

export function buildWorkoutPayloadFromHistorySession(
  data: WorkoutHistoryData,
  sessionId: string,
): ApplyWorkoutFromHistoryPayload {
  const exercises = data.exercises
    .map((exercise) => {
      const sessionRows = exercise.rows
        .filter((row) => row.sessionId === sessionId)
        .sort((a, b) => a.setIndex - b.setIndex);

      if (sessionRows.length === 0) return null;

      return {
        name: exercise.name,
        orderIndex: exercise.orderIndex,
        sets: sessionRows.map((row) => ({
          weight: row.weightUsed?.toString() || '',
          reps: row.repsCompleted?.toString() || '',
          targetRpe: row.rpe?.toString() || '',
        })),
      };
    })
    .filter((ex): ex is NonNullable<typeof ex> => ex != null)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(({ name, sets }) => ({ name, sets }));

  return { exercises };
}

export function buildExercisePayloadFromWorkoutHistorySession(
  exercise: WorkoutExerciseHistory,
  sessionId: string,
): ApplyExerciseFromHistoryPayload | null {
  const sessionRows = exercise.rows
    .filter((row) => row.sessionId === sessionId)
    .sort((a, b) => a.setIndex - b.setIndex);

  if (sessionRows.length === 0) return null;

  return {
    name: exercise.name,
    sets: sessionRows.map((row) => ({
      weight: row.weightUsed?.toString() || '',
      reps: row.repsCompleted?.toString() || '',
      targetRpe: row.rpe?.toString() || '',
    })),
  };
}

export function buildBlankExercisePayloadFromHistory(
  exercise: WorkoutExerciseHistory,
): ApplyExerciseFromHistoryPayload {
  const latestSessionId = exercise.rows[0]?.sessionId;
  const setCount = latestSessionId
    ? exercise.rows.filter((row) => row.sessionId === latestSessionId).length
    : 1;

  return {
    name: exercise.name,
    sets: Array.from({ length: Math.max(setCount, 1) }, () => ({
      reps: '',
      weight: '',
      restTime: '60',
    })),
  };
}
