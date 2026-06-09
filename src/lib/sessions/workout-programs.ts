import { parseISO } from 'date-fns';
import { SessionSummary } from '@/types';

export interface WorkoutProgramSummary {
  workoutId: string;
  workoutName: string;
  latestSession: SessionSummary;
  sessionCount: number;
}

export function groupSessionsByWorkout(sessions: SessionSummary[]): WorkoutProgramSummary[] {
  const byWorkout = new Map<string, SessionSummary[]>();

  for (const session of sessions) {
    if (!session.workoutId) continue;
    const list = byWorkout.get(session.workoutId) ?? [];
    list.push(session);
    byWorkout.set(session.workoutId, list);
  }

  return [...byWorkout.entries()]
    .map(([workoutId, workoutSessions]) => {
      const sorted = [...workoutSessions].sort(
        (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
      );
      return {
        workoutId,
        workoutName: sorted[0].workoutName ?? 'Nimetön treeni',
        latestSession: sorted[0],
        sessionCount: sorted.length,
      };
    })
    .sort(
      (a, b) =>
        parseISO(b.latestSession.date).getTime() - parseISO(a.latestSession.date).getTime(),
    );
}
