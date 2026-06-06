import { endOfWeek, parseISO, startOfWeek, subDays, subWeeks } from 'date-fns';
import {
  calculateE1RM,
  getExerciseE1RMTrend,
  WorkoutSessionWithSets,
} from '@/lib/analytics';
import {
  ClientPersonalRecord,
  ExerciseProgressRow,
} from '@/types';
import { ClientSessionRow } from './types';

export interface ClientExerciseProgress {
  exerciseName: string;
  currentE1RM: number;
  trend: 'up' | 'down' | 'stable';
}

export function mapToAnalyticsSessions(rows: ClientSessionRow[]): WorkoutSessionWithSets[] {
  return rows
    .filter((row) => row.date)
    .map((row) => ({
      id: row.id,
      date: row.date!,
      duration: row.duration ?? 0,
      total_volume: row.total_volume ?? 0,
      exercises: (row.session_exercises ?? [])
        .map((ex) => ({
          name: ex.name,
          category: null,
          sets: (ex.session_sets ?? [])
            .filter((set) => (set.weight_used ?? 0) > 0 && (set.reps_completed ?? 0) > 0)
            .map((set) => ({
              weight_used: set.weight_used ?? 0,
              reps_completed: set.reps_completed ?? 0,
            })),
        }))
        .filter((ex) => ex.sets.length > 0),
    }))
    .filter((s) => s.exercises.length > 0);
}

export function findAllPersonalRecords(
  sessions: WorkoutSessionWithSets[],
  periodStart?: Date,
): ClientPersonalRecord[] {
  const sorted = [...sessions].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
  );
  const records: ClientPersonalRecord[] = [];
  const bestE1RMByExercise = new Map<string, number>();

  for (const session of sorted) {
    for (const exercise of session.exercises) {
      const maxInSession = Math.max(
        0,
        ...exercise.sets.map((set) =>
          calculateE1RM(set.weight_used, set.reps_completed),
        ),
      );
      if (maxInSession === 0) continue;

      const previousBest = bestE1RMByExercise.get(exercise.name) ?? 0;

      if (maxInSession > previousBest && previousBest > 0) {
        const sessionDate = parseISO(session.date);
        if (!periodStart || sessionDate >= periodStart) {
          records.push({
            exerciseName: exercise.name,
            e1rm: maxInSession,
            previousBest,
            improvementPercent: Math.round(
              ((maxInSession - previousBest) / previousBest) * 100,
            ),
            sessionId: session.id,
            date: session.date,
          });
        }
      }

      bestE1RMByExercise.set(
        exercise.name,
        Math.max(previousBest, maxInSession),
      );
    }
  }

  return records.sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
  );
}

export function buildExerciseProgressTable(
  sessions: WorkoutSessionWithSets[],
  periodWeeks: number,
  minSessions = 2,
): ExerciseProgressRow[] {
  const now = new Date();
  const periodStart = startOfWeek(subWeeks(now, periodWeeks), { weekStartsOn: 1 });
  const previousPeriodStart = startOfWeek(subWeeks(now, periodWeeks * 2), { weekStartsOn: 1 });

  const exerciseCounts: Record<string, number> = {};
  for (const session of sessions) {
    for (const exercise of session.exercises) {
      exerciseCounts[exercise.name] = (exerciseCounts[exercise.name] ?? 0) + 1;
    }
  }

  const rows: ExerciseProgressRow[] = [];

  for (const [exerciseName, sessionCount] of Object.entries(exerciseCounts)) {
    if (sessionCount < minSessions) continue;

    const sessionsWithExercise = sessions.filter((s) =>
      s.exercises.some((ex) => ex.name === exerciseName),
    );

    const formatted = sessionsWithExercise.map((s) => ({
      date: s.date,
      sets: s.exercises.find((ex) => ex.name === exerciseName)?.sets ?? [],
    }));

    const trend = getExerciseE1RMTrend(exerciseName, formatted);
    if (trend.currentE1RM === 0) continue;

    const currentPeriodE1RMs = sessionsWithExercise
      .filter((s) => parseISO(s.date) >= periodStart)
      .map((s) => {
        const sets = s.exercises.find((ex) => ex.name === exerciseName)?.sets ?? [];
        return Math.max(
          0,
          ...sets.map((set) => calculateE1RM(set.weight_used, set.reps_completed)),
        );
      })
      .filter((v) => v > 0);

    const previousPeriodE1RMs = sessionsWithExercise
      .filter((s) => {
        const d = parseISO(s.date);
        return d >= previousPeriodStart && d < periodStart;
      })
      .map((s) => {
        const sets = s.exercises.find((ex) => ex.name === exerciseName)?.sets ?? [];
        return Math.max(
          0,
          ...sets.map((set) => calculateE1RM(set.weight_used, set.reps_completed)),
        );
      })
      .filter((v) => v > 0);

    const currentAvg =
      currentPeriodE1RMs.length > 0
        ? currentPeriodE1RMs.reduce((a, b) => a + b, 0) / currentPeriodE1RMs.length
        : null;
    const previousAvg =
      previousPeriodE1RMs.length > 0
        ? previousPeriodE1RMs.reduce((a, b) => a + b, 0) / previousPeriodE1RMs.length
        : null;

    let changePercent: number | null = null;
    if (currentAvg != null && previousAvg != null && previousAvg > 0) {
      changePercent = Math.round(((currentAvg - previousAvg) / previousAvg) * 100);
    }

    rows.push({
      exerciseName,
      sessionCount,
      currentE1RM: trend.currentE1RM,
      bestE1RM: trend.bestE1RM,
      changePercent,
      trend: trend.trend,
      history: trend.history ?? [],
    });
  }

  return rows.sort((a, b) => b.sessionCount - a.sessionCount);
}

export function computeStrengthChangePercent(
  exerciseProgress: ExerciseProgressRow[],
  topCount = 3,
): number | null {
  const top = exerciseProgress.slice(0, topCount);
  const withChange = top.filter((e) => e.changePercent != null);
  if (withChange.length === 0) return null;
  return Math.round(
    withChange.reduce((sum, e) => sum + e.changePercent!, 0) / withChange.length,
  );
}

export function getClientTopExerciseProgress(
  sessions: WorkoutSessionWithSets[],
): ClientExerciseProgress | null {
  const table = buildExerciseProgressTable(sessions, 8, 2);
  if (table.length === 0) return null;
  const top = table[0];
  return {
    exerciseName: top.exerciseName,
    currentE1RM: top.currentE1RM,
    trend: top.trend,
  };
}

export function findRecentPersonalRecordsForDashboard(
  sessionsByClient: Map<string, WorkoutSessionWithSets[]>,
  profilesById: Map<string, string>,
  lookbackDays = 14,
): import('@/types').PersonalRecord[] {
  const cutoff = subDays(new Date(), lookbackDays);
  const records: import('@/types').PersonalRecord[] = [];

  for (const [clientId, sessions] of sessionsByClient) {
    const clientRecords = findAllPersonalRecords(sessions, cutoff);
    for (const pr of clientRecords) {
      records.push({
        ...pr,
        clientId,
        clientNickname: profilesById.get(clientId) ?? 'Nimetön urheilija',
      });
    }
  }

  return records
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime())
    .slice(0, 12);
}

export function getPeriodBounds(periodWeeks: number, now = new Date()) {
  const currentStart = startOfWeek(subWeeks(now, periodWeeks - 1), { weekStartsOn: 1 });
  const previousStart = startOfWeek(subWeeks(now, periodWeeks * 2 - 1), { weekStartsOn: 1 });
  const previousEnd = endOfWeek(subWeeks(now, periodWeeks), { weekStartsOn: 1 });
  return { currentStart, previousStart, previousEnd, now };
}

export function sumVolumeInRange(
  rows: ClientSessionRow[],
  start: Date,
  end: Date,
): number {
  return rows
    .filter((s) => {
      if (!s.date) return false;
      const d = parseISO(s.date);
      return d >= start && d <= end;
    })
    .reduce((sum, s) => sum + (s.total_volume ?? 0), 0);
}
