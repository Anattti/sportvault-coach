import { format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  computeCompliancePercent,
  getCurrentWeekBounds,
  isDateInCurrentWeek,
  isProgramStuck,
} from '@/lib/dashboard/compliance';
import { ComplianceWeek, CycleProgressPoint } from '@/types';
import { ClientSessionRow } from './types';

export function buildComplianceHistory(
  sessionRows: ClientSessionRow[],
  scheduledByWeek: Map<string, number>,
  assignedWorkoutCount: number,
  weeksCount = 8,
): ComplianceWeek[] {
  const now = new Date();
  const weeks: ComplianceWeek[] = [];

  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekKey = weekStart.toISOString().slice(0, 10);

    const completed = sessionRows.filter((s) => {
      if (!s.date) return false;
      const d = parseISO(s.date);
      return d >= weekStart && d <= weekEnd;
    }).length;

    const scheduled = scheduledByWeek.get(weekKey) ?? 0;
    const planned = scheduled > 0 ? scheduled : assignedWorkoutCount > 0 ? assignedWorkoutCount : 0;

    weeks.push({
      label: format(weekStart, 'd.M.', { locale: fi }),
      planned,
      completed,
      compliancePercent: planned > 0 ? computeCompliancePercent(completed, planned) : null,
      isCurrentWeek: i === 0,
    });
  }

  return weeks;
}

export function buildScheduledByWeek(
  scheduledRows: Array<{ scheduled_date: string; status: string | null }>,
  weeksCount = 8,
): Map<string, number> {
  const now = new Date();
  const map = new Map<string, number>();

  for (const row of scheduledRows) {
    if (row.status === 'cancelled') continue;
    const date = parseISO(row.scheduled_date);
    for (let i = weeksCount - 1; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (date >= weekStart && date <= weekEnd) {
        const key = weekStart.toISOString().slice(0, 10);
        map.set(key, (map.get(key) ?? 0) + 1);
        break;
      }
    }
  }

  return map;
}

export function buildCycleProgress(
  sessionRows: ClientSessionRow[],
): CycleProgressPoint[] {
  return sessionRows
    .filter((s) => s.date && s.cycle_week != null)
    .sort((a, b) => parseISO(a.date!).getTime() - parseISO(b.date!).getTime())
    .map((s, i, arr) => {
      const prev = arr[i - 1];
      let programStuck = false;
      if (
        prev &&
        prev.cycle_week === s.cycle_week &&
        prev.workout_id === s.workout_id &&
        prev.workout_id
      ) {
        const currentWeek = startOfWeek(parseISO(s.date!), { weekStartsOn: 1 });
        const previousWeek = startOfWeek(parseISO(prev.date!), { weekStartsOn: 1 });
        programStuck = currentWeek.getTime() !== previousWeek.getTime();
      }
      return {
        date: s.date!,
        cycleWeek: s.cycle_week!,
        workoutId: s.workout_id,
        programStuck,
      };
    });
}

export function computeTrainingStreak(complianceHistory: ComplianceWeek[]): number {
  let streak = 0;
  for (let i = complianceHistory.length - 1; i >= 0; i--) {
    const week = complianceHistory[i];
    if (week.planned === 0) {
      if (week.completed > 0) streak++;
      else break;
      continue;
    }
    if (week.compliancePercent != null && week.compliancePercent >= 80) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getThisWeekCompliance(
  sessionRows: ClientSessionRow[],
  scheduledThisWeek: number,
  assignedWorkoutCount: number,
): number | null {
  const { weekStart, weekEnd } = getCurrentWeekBounds(new Date());
  const completed = sessionRows.filter((s) => {
    if (!s.date) return false;
    return isDateInCurrentWeek(s.date, weekStart, weekEnd);
  }).length;

  const planned =
    scheduledThisWeek > 0
      ? scheduledThisWeek
      : assignedWorkoutCount > 0
        ? assignedWorkoutCount
        : null;

  return computeCompliancePercent(completed, planned);
}

export function isClientProgramStuck(sessionRows: ClientSessionRow[]): boolean {
  return isProgramStuck(
    sessionRows.map((s) => ({
      date: s.date,
      cycle_week: s.cycle_week,
      workout_id: s.workout_id,
    })),
  );
}
