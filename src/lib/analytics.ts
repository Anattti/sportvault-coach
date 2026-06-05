import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export interface AnalyticsWorkoutSet {
  weight_used: number;
  reps_completed: number;
}

export interface AnalyticsSessionExercise {
  name: string;
  category: string | null;
  sets: AnalyticsWorkoutSet[];
}

export interface WorkoutSessionWithSets {
  id: string;
  date: string;
  duration: number;
  total_volume: number;
  exercises: AnalyticsSessionExercise[];
  workoutName?: string;
}

// Epley formula
export function calculateE1RM(weight: number, reps: number): number {
  if (reps === 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

export function getWeeklyVolumeTrend(
  sessions: WorkoutSessionWithSets[],
  weeksCount: number = 8,
) {
  const weeks: { label: string; volume: number; date: Date }[] = [];
  const now = new Date();

  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 });

    const weeklyVolume = sessions
      .filter((s) => {
        const d = new Date(s.date);
        return d >= weekStart && d <= weekEnd;
      })
      .reduce((sum, s) => sum + s.total_volume, 0);

    weeks.push({
      label: `W${getWeekNumber(weekStart)}`,
      volume: weeklyVolume,
      date: weekStart,
    });
  }
  return weeks;
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getExerciseE1RMTrend(
  exerciseName: string,
  sessions: { date: string; sets: AnalyticsWorkoutSet[] }[],
) {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const dataPoints = sorted.map((s) => {
    const maxE1RM = Math.max(
      ...s.sets.map((set) => calculateE1RM(set.weight_used, set.reps_completed)),
    );
    return { date: s.date, value: maxE1RM };
  });

  if (dataPoints.length === 0)
    return { exerciseName, currentE1RM: 0, bestE1RM: 0, trend: 'stable' as const };

  const currentE1RM = dataPoints[dataPoints.length - 1].value;
  const bestE1RM = Math.max(...dataPoints.map((d) => d.value));

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (dataPoints.length >= 3) {
    const last3 = dataPoints.slice(-3);
    if (last3[2].value > last3[0].value * 1.025) trend = 'up';
    else if (last3[2].value < last3[0].value * 0.975) trend = 'down';
  }

  return { exerciseName, currentE1RM, bestE1RM, trend, history: dataPoints };
}

export function detectVolumeSpike(sessions: WorkoutSessionWithSets[]) {
  const weeks = getWeeklyVolumeTrend(sessions, 5);
  if (weeks.length < 2) return null;

  const currentWeek = weeks[weeks.length - 1];
  const previousWeeks = weeks.slice(0, weeks.length - 1);
  const avgVolume = previousWeeks.reduce((sum, w) => sum + w.volume, 0) / previousWeeks.length;

  if (avgVolume === 0) return null;

  const percentChange = ((currentWeek.volume - avgVolume) / avgVolume) * 100;

  return {
    hasSpike: percentChange > 30,
    percentChange,
    currentVolume: currentWeek.volume,
    avgVolume,
  };
}
