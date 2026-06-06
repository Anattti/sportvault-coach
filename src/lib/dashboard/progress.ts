import { WorkoutSessionWithSets } from '@/lib/analytics';
import {
  ClientExerciseProgress,
  findRecentPersonalRecordsForDashboard,
  getClientTopExerciseProgress,
  mapToAnalyticsSessions,
} from '@/lib/client-analytics/progress';
import { PersonalRecord } from '@/types';

export type { ClientExerciseProgress };

type SessionRow = {
  id: string;
  user_id: string | null;
  date: string | null;
  session_exercises: Array<{
    name: string;
    session_sets: Array<{
      weight_used: number | null;
      reps_completed: number | null;
    }> | null;
  }> | null;
};

export { mapToAnalyticsSessions, getClientTopExerciseProgress };

export function findRecentPersonalRecords(
  sessionsByClient: Map<string, WorkoutSessionWithSets[]>,
  profilesById: Map<string, string>,
  lookbackDays = 14,
): PersonalRecord[] {
  return findRecentPersonalRecordsForDashboard(
    sessionsByClient,
    profilesById,
    lookbackDays,
  );
}

export function analyzeProgressData(
  rows: SessionRow[],
  profilesById: Map<string, string>,
): {
  recentPRs: PersonalRecord[];
  progressByClient: Map<string, ClientExerciseProgress | null>;
} {
  const analyticsSessions = mapToAnalyticsSessions(
    rows.map((row) => ({
      ...row,
      workout_id: null,
      duration: null,
      total_volume: null,
      rpe_average: null,
      cycle_week: null,
      is_deload: null,
      session_exercises: (row.session_exercises ?? []).map((ex) => ({
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

  const sessionsByClient = new Map<string, WorkoutSessionWithSets[]>();

  for (const row of rows) {
    if (!row.user_id) continue;
    const session = analyticsSessions.find((s) => s.id === row.id);
    if (!session) continue;
    const list = sessionsByClient.get(row.user_id) ?? [];
    list.push(session);
    sessionsByClient.set(row.user_id, list);
  }

  const recentPRs = findRecentPersonalRecords(sessionsByClient, profilesById);
  const progressByClient = new Map<string, ClientExerciseProgress | null>();

  for (const [clientId, sessions] of sessionsByClient) {
    progressByClient.set(clientId, getClientTopExerciseProgress(sessions));
  }

  return { recentPRs, progressByClient };
}
