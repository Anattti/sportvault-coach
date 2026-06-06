import { endOfWeek, parseISO, startOfWeek, subWeeks } from 'date-fns';
import { detectVolumeSpike, WorkoutSessionWithSets } from '@/lib/analytics';
import { WeeklyMetricPoint } from '@/types';

type SessionLike = {
  id: string;
  date: string | null;
  duration: number | null;
  total_volume: number | null;
  rpe_average: number | null;
};

export function toAnalyticsSessions(sessions: SessionLike[]): WorkoutSessionWithSets[] {
  return sessions
    .filter((s) => s.date)
    .map((s) => ({
      id: s.id,
      date: s.date!,
      duration: s.duration ?? 0,
      total_volume: s.total_volume ?? 0,
      exercises: [],
    }));
}

export function computePercentChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function isRpeElevated(sessions: SessionLike[]): boolean {
  const sorted = [...sessions]
    .filter((s) => s.date)
    .sort((a, b) => parseISO(b.date!).getTime() - parseISO(a.date!).getTime());

  const recent = sorted.slice(0, 3);
  const rpes = recent
    .map((s) => s.rpe_average)
    .filter((v): v is number => v != null);

  if (rpes.length < 2) return false;
  return rpes.reduce((sum, v) => sum + v, 0) / rpes.length > 8.5;
}

export function hasClientVolumeSpike(sessions: SessionLike[]): boolean {
  const spike = detectVolumeSpike(toAnalyticsSessions(sessions));
  return spike?.hasSpike ?? false;
}

export function getPortfolioVolumeSpike(sessions: SessionLike[]) {
  return detectVolumeSpike(toAnalyticsSessions(sessions));
}

export function buildWeeklyMetrics(
  sessions: SessionLike[],
  weeksCount: number,
  getValue: (session: SessionLike) => number,
  labelFormatter: (weekStart: Date) => string,
): WeeklyMetricPoint[] {
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weeks: WeeklyMetricPoint[] = [];

  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });

    const value = sessions
      .filter((s) => {
        if (!s.date) return false;
        const d = parseISO(s.date);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, s) => sum + getValue(s), 0);

    weeks.push({
      label: labelFormatter(weekStart),
      value,
      isCurrentWeek: weekStart.getTime() === currentWeekStart.getTime(),
    });
  }

  return weeks;
}

export function getVolumeTrendLabel(
  currentWeekVolume: number,
  previousWeeksAverage: number,
): { text: string; tone: 'up' | 'down' | 'neutral' } {
  if (previousWeeksAverage === 0) {
    return currentWeekVolume > 0
      ? { text: 'Ensimmäinen viikko datalla', tone: 'neutral' }
      : { text: 'Ei vielä volyymidataa', tone: 'neutral' };
  }

  const percent = Math.round(
    ((currentWeekVolume - previousWeeksAverage) / previousWeeksAverage) * 100,
  );

  if (percent > 10) {
    return { text: `+${percent} % vs. 4 vk keskiarvo`, tone: 'up' };
  }
  if (percent < -10) {
    return { text: `${percent} % vs. 4 vk keskiarvo`, tone: 'down' };
  }
  return { text: 'Linjassa 4 vk keskiarvon kanssa', tone: 'neutral' };
}
