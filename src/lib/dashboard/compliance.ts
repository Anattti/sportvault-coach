import { endOfWeek, parseISO, startOfWeek } from 'date-fns';

export interface ClientProgramContext {
  assignedWorkoutCount: number;
  scheduledThisWeek: number;
  activeProgramName: string | null;
  hasAssignedProgram: boolean;
}

export interface SessionForCompliance {
  date: string | null;
  cycle_week: number | null;
  workout_id: string | null;
}

export function getPlannedSessionsThisWeek(ctx: ClientProgramContext): number | null {
  if (ctx.scheduledThisWeek > 0) return ctx.scheduledThisWeek;
  if (ctx.assignedWorkoutCount > 0) return ctx.assignedWorkoutCount;
  return null;
}

export function computeCompliancePercent(
  completed: number,
  planned: number | null,
): number | null {
  if (planned == null || planned === 0) return null;
  return Math.min(100, Math.round((completed / planned) * 100));
}

export function isProgramStuck(sessions: SessionForCompliance[]): boolean {
  const sorted = sessions
    .filter((s) => s.date && s.cycle_week != null && s.workout_id)
    .sort((a, b) => parseISO(b.date!).getTime() - parseISO(a.date!).getTime());

  if (sorted.length < 2) return false;

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const previous = sorted[i + 1];

    if (
      current.cycle_week !== previous.cycle_week ||
      current.workout_id !== previous.workout_id
    ) {
      continue;
    }

    const currentWeek = startOfWeek(parseISO(current.date!), { weekStartsOn: 1 });
    const previousWeek = startOfWeek(parseISO(previous.date!), { weekStartsOn: 1 });

    if (currentWeek.getTime() !== previousWeek.getTime()) {
      return true;
    }
  }

  return false;
}

export function buildProgramContextMap(
  clientIds: string[],
  assignments: Array<{
    client_id: string;
    workout_id: string;
    workouts: { program: string | null } | null;
  }>,
  managedWorkouts: Array<{
    id: string;
    user_id: string;
    program: string | null;
  }>,
  scheduledThisWeekByClient: Map<string, number>,
): Map<string, ClientProgramContext> {
  const map = new Map<string, ClientProgramContext>();

  for (const clientId of clientIds) {
    const clientAssignments = assignments.filter((a) => a.client_id === clientId);
    const clientManaged = managedWorkouts.filter((w) => w.user_id === clientId);

    const assignmentWorkoutIds = new Set(clientAssignments.map((a) => a.workout_id));
    const managedIds = clientManaged.map((w) => w.id);
    const allWorkoutIds = new Set([...assignmentWorkoutIds, ...managedIds]);

    const latestAssignment = clientAssignments[0];
    const activeProgramName =
      latestAssignment?.workouts?.program ??
      clientManaged[0]?.program ??
      null;

    map.set(clientId, {
      assignedWorkoutCount: allWorkoutIds.size,
      scheduledThisWeek: scheduledThisWeekByClient.get(clientId) ?? 0,
      activeProgramName,
      hasAssignedProgram: allWorkoutIds.size > 0,
    });
  }

  return map;
}

export function isDateInCurrentWeek(dateStr: string, weekStart: Date, weekEnd: Date): boolean {
  const d = parseISO(dateStr);
  return d >= weekStart && d <= weekEnd;
}

export function getCurrentWeekBounds(now: Date): { weekStart: Date; weekEnd: Date } {
  return {
    weekStart: startOfWeek(now, { weekStartsOn: 1 }),
    weekEnd: endOfWeek(now, { weekStartsOn: 1 }),
  };
}

export function computePortfolioCompliance(
  overviews: Array<{
    totalSessionsThisWeek: number;
    plannedSessionsThisWeek: number | null;
  }>,
): { planned: number; compliancePercent: number | null } {
  const withPlan = overviews.filter(
    (o) => o.plannedSessionsThisWeek != null && o.plannedSessionsThisWeek > 0,
  );

  if (withPlan.length === 0) return { planned: 0, compliancePercent: null };

  const planned = withPlan.reduce((sum, o) => sum + o.plannedSessionsThisWeek!, 0);
  const completed = withPlan.reduce(
    (sum, o) => sum + Math.min(o.totalSessionsThisWeek, o.plannedSessionsThisWeek!),
    0,
  );

  return {
    planned,
    compliancePercent: planned > 0 ? Math.round((completed / planned) * 100) : null,
  };
}
