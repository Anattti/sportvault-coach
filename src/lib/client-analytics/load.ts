import { format, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { fi } from 'date-fns/locale';
import { detectVolumeSpike } from '@/lib/analytics';
import { buildWeeklyMetrics, computePercentChange } from '@/lib/dashboard/metrics';
import { LoadMetrics, VolumeSpikeAlert } from '@/types';
import { ClientSessionRow } from './types';
import { mapToAnalyticsSessions } from './progress';

type SessionLike = ClientSessionRow;

function averageWeeklyRpe(sessions: SessionLike[], weekStart: Date, weekEnd: Date): number {
  const rpes = sessions
    .filter((s) => {
      if (!s.date) return false;
      const d = parseISO(s.date);
      return d >= weekStart && d <= weekEnd;
    })
    .map((s) => s.rpe_average)
    .filter((v): v is number => v != null);

  if (rpes.length === 0) return 0;
  return Math.round((rpes.reduce((a, b) => a + b, 0) / rpes.length) * 10) / 10;
}

export function buildLoadMetrics(
  rows: SessionLike[],
  weeksCount = 8,
): LoadMetrics {
  const analyticsSessions = mapToAnalyticsSessions(rows);
  const spike = detectVolumeSpike(analyticsSessions);

  const volumeSpike: VolumeSpikeAlert | null = spike?.hasSpike
    ? {
        hasSpike: true,
        percentChange: Math.round(spike.percentChange),
        currentVolume: spike.currentVolume,
        avgVolume: Math.round(spike.avgVolume),
      }
    : null;

  const weeklyVolume = buildWeeklyMetrics(
    rows,
    weeksCount,
    (s) => s.total_volume ?? 0,
    (weekStart) => format(weekStart, 'd.M.', { locale: fi }),
  );

  const weeklySessions = buildWeeklyMetrics(
    rows,
    weeksCount,
    () => 1,
    (weekStart) => format(weekStart, 'd.M.', { locale: fi }),
  );

  const now = new Date();
  const weeklyRpe = buildWeeklyMetrics(
    rows,
    weeksCount,
    (s) => s.rpe_average ?? 0,
    (weekStart) => format(weekStart, 'd.M.', { locale: fi }),
  ).map((point, i) => {
    const weekStart = startOfWeek(subWeeks(now, weeksCount - 1 - i), { weekStartsOn: 1 });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const avg = averageWeeklyRpe(rows, weekStart, weekEnd);
    return { ...point, value: avg };
  });

  const acwr = computeAcwr(rows);
  const avgIntensity = computeAvgIntensity(analyticsSessions);

  return {
    acwr,
    acwrWarning: acwr != null && acwr > 1.5,
    weeklyVolume,
    weeklySessions,
    weeklyRpe,
    volumeSpike,
    avgIntensity,
  };
}

export function computeAcwr(rows: SessionLike[]): number | null {
  const now = new Date();
  const acuteStart = startOfWeek(now, { weekStartsOn: 1 });
  const chronicStart = startOfWeek(subWeeks(now, 4), { weekStartsOn: 1 });

  const acuteVolume = rows
    .filter((s) => s.date && parseISO(s.date) >= acuteStart)
    .reduce((sum, s) => sum + (s.total_volume ?? 0), 0);

  const chronicSessions = rows.filter((s) => {
    if (!s.date) return false;
    const d = parseISO(s.date);
    return d >= chronicStart && d < acuteStart;
  });

  if (chronicSessions.length === 0) return null;

  const chronicWeeklyAvg =
    chronicSessions.reduce((sum, s) => sum + (s.total_volume ?? 0), 0) / 4;

  if (chronicWeeklyAvg === 0) return null;

  return Math.round((acuteVolume / chronicWeeklyAvg) * 100) / 100;
}

function computeAvgIntensity(
  sessions: ReturnType<typeof mapToAnalyticsSessions>,
): number | null {
  let totalVolume = 0;
  let totalSets = 0;

  for (const session of sessions) {
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        totalVolume += set.weight_used * set.reps_completed;
        totalSets += 1;
      }
    }
  }

  if (totalSets === 0) return null;
  return Math.round(totalVolume / totalSets);
}

export function computeVolumeChangePercent(
  rows: SessionLike[],
  periodWeeks: number,
): number | null {
  const now = new Date();
  const currentStart = startOfWeek(subWeeks(now, periodWeeks - 1), { weekStartsOn: 1 });
  const previousStart = startOfWeek(subWeeks(now, periodWeeks * 2 - 1), { weekStartsOn: 1 });
  const previousEnd = new Date(currentStart);
  previousEnd.setMilliseconds(-1);

  const currentVol = rows
    .filter((s) => s.date && parseISO(s.date) >= currentStart)
    .reduce((sum, s) => sum + (s.total_volume ?? 0), 0);

  const previousVol = rows
    .filter((s) => {
      if (!s.date) return false;
      const d = parseISO(s.date);
      return d >= previousStart && d <= previousEnd;
    })
    .reduce((sum, s) => sum + (s.total_volume ?? 0), 0);

  return computePercentChange(currentVol, previousVol);
}
