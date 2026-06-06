import { parseISO } from 'date-fns';
import { isProgramStuck, SessionForCompliance } from '@/lib/dashboard/compliance';

export interface ProgramMetaSource {
  program: string | null;
  cycle_weeks: number | null;
  programmed_deloads?: number[] | null;
}

export interface CycleStatusSession {
  date: string | null;
  cycle_week: number | null;
  workout_id: string | null;
}

export interface ProgramCycleStatus {
  programName: string | null;
  currentWeek: number | null;
  totalWeeks: number | null;
  programmedDeloads: number[];
  isDeloadWeek: boolean;
  programStuck: boolean;
  hasCycle: boolean;
}

export function resolveActiveProgramMeta(
  assignmentWorkout: ProgramMetaSource | null | undefined,
  managedWorkout: ProgramMetaSource | null | undefined,
  latestSessionWorkout: ProgramMetaSource | null | undefined,
): ProgramMetaSource {
  return {
    program:
      assignmentWorkout?.program ??
      managedWorkout?.program ??
      latestSessionWorkout?.program ??
      null,
    cycle_weeks:
      assignmentWorkout?.cycle_weeks ??
      managedWorkout?.cycle_weeks ??
      latestSessionWorkout?.cycle_weeks ??
      null,
    programmed_deloads:
      assignmentWorkout?.programmed_deloads ??
      managedWorkout?.programmed_deloads ??
      latestSessionWorkout?.programmed_deloads ??
      [],
  };
}

export function resolveCycleStatus(
  sessions: CycleStatusSession[],
  programMeta: ProgramMetaSource,
): ProgramCycleStatus {
  const sorted = [...sessions].sort((a, b) => {
    const dateA = a.date ? parseISO(a.date).getTime() : 0;
    const dateB = b.date ? parseISO(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const latestSession = sorted[0];
  const currentWeek = latestSession?.cycle_week ?? null;
  const totalWeeks = programMeta.cycle_weeks;
  const programmedDeloads = programMeta.programmed_deloads ?? [];
  const isDeloadWeek =
    currentWeek != null && programmedDeloads.includes(currentWeek);

  const complianceSessions: SessionForCompliance[] = sessions.map((session) => ({
    date: session.date,
    cycle_week: session.cycle_week,
    workout_id: session.workout_id,
  }));

  return {
    programName: programMeta.program,
    currentWeek,
    totalWeeks,
    programmedDeloads,
    isDeloadWeek,
    programStuck: isProgramStuck(complianceSessions),
    hasCycle: totalWeeks != null && totalWeeks > 1 && currentWeek != null,
  };
}
