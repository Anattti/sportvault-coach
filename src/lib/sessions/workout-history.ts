import { parseISO, startOfWeek } from 'date-fns';
import { calculateE1RM } from '@/lib/analytics';
import {
  CycleRunGroup,
  SessionSummary,
  WeekHistoryGroup,
  WorkoutExerciseHistory,
  WorkoutExerciseSetRow,
  WorkoutHistoryData,
  WorkoutHistoryMeta,
  WorkoutHistorySession,
} from '@/types';
import { fetchNotedSessionIds, formatSessionSummaries } from '@/lib/sessions/format';

export function isNewCycleRun(
  previous: SessionSummary | null,
  current: SessionSummary,
): boolean {
  if (!previous || current.cycleWeek == null) return false;
  if (previous.cycleWeek == null) return false;

  if (current.cycleWeek === 1 && previous.cycleWeek > 1) return true;
  if (current.cycleWeek < previous.cycleWeek) return true;

  return false;
}

export function computeVolumeChangePercent(
  currentVolume: number,
  previousVolume: number | null | undefined,
): number | null {
  if (previousVolume == null || previousVolume <= 0) return null;
  const change = ((currentVolume - previousVolume) / previousVolume) * 100;
  return Math.round(change * 10) / 10;
}

export function enrichSessionsWithVolumeChange(
  sessions: SessionSummary[],
): WorkoutHistorySession[] {
  const sorted = [...sessions].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
  );

  const previousByWeek = new Map<number, SessionSummary>();

  return sorted.map((session) => {
    const cycleWeek = session.cycleWeek;
    let volumeChangePercent: number | null = null;

    if (cycleWeek != null) {
      const previous = previousByWeek.get(cycleWeek);
      volumeChangePercent = computeVolumeChangePercent(
        session.totalVolume,
        previous?.totalVolume,
      );
      previousByWeek.set(cycleWeek, session);
    }

    return { ...session, volumeChangePercent };
  });
}

export function splitIntoCycleRuns(sessions: WorkoutHistorySession[]): WorkoutHistorySession[][] {
  if (sessions.length === 0) return [];

  const scheduled = sessions.filter((s) => s.cycleWeek != null);
  if (scheduled.length === 0) return [];

  const runs: WorkoutHistorySession[][] = [[scheduled[0]]];

  for (let i = 1; i < scheduled.length; i++) {
    const current = scheduled[i];
    const previous = scheduled[i - 1];

    if (isNewCycleRun(previous, current)) {
      runs.push([current]);
    } else {
      runs[runs.length - 1].push(current);
    }
  }

  return runs;
}

export function groupRunByWeeks(
  runSessions: WorkoutHistorySession[],
  cycleWeeks: number,
  programmedDeloads: number[],
): WeekHistoryGroup[] {
  const byWeek = new Map<number, WorkoutHistorySession[]>();

  for (const session of runSessions) {
    if (session.cycleWeek == null) continue;
    const week = session.cycleWeek;
    if (!byWeek.has(week)) byWeek.set(week, []);
    byWeek.get(week)!.push(session);
  }

  const weeks: WeekHistoryGroup[] = [];

  for (let week = 1; week <= cycleWeeks; week++) {
    const weekSessions = (byWeek.get(week) ?? []).sort(
      (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
    );

    weeks.push({
      cycleWeek: week,
      isDeload: programmedDeloads.includes(week),
      sessions: weekSessions,
      isEmpty: weekSessions.length === 0,
    });
  }

  const extraWeeks = [...byWeek.keys()]
    .filter((week) => week > cycleWeeks)
    .sort((a, b) => a - b);

  for (const week of extraWeeks) {
    const weekSessions = (byWeek.get(week) ?? []).sort(
      (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
    );

    weeks.push({
      cycleWeek: week,
      isDeload: programmedDeloads.includes(week),
      sessions: weekSessions,
      isEmpty: weekSessions.length === 0,
    });
  }

  return weeks;
}

export function buildCycleRunGroups(
  sessions: WorkoutHistorySession[],
  cycleWeeks: number,
  programmedDeloads: number[],
): CycleRunGroup[] {
  const runs = splitIntoCycleRuns(sessions);

  return runs.map((runSessions, index) => {
    const dates = runSessions.map((s) => s.date).sort();
    return {
      runIndex: index + 1,
      startDate: dates[0] ?? '',
      endDate: dates[dates.length - 1] ?? '',
      weeks: groupRunByWeeks(runSessions, cycleWeeks, programmedDeloads),
    };
  });
}

type TemplateExercise = {
  id: string;
  name: string;
  order_index: number | null;
};

type RawSessionExercise = {
  id: string;
  name: string;
  order_index: number;
  exercise_id: string | null;
  is_ad_hoc: boolean | null;
  session_sets: Array<{
    id: string;
    set_index: number;
    weight_used: number | null;
    reps_completed: number | null;
    rpe: number | null;
  }> | null;
};

type SessionWithExercises = WorkoutHistorySessionRow & {
  session_exercises?: RawSessionExercise[] | null;
};

type RawSetRow = NonNullable<RawSessionExercise['session_sets']>[number];

export function resolveDisplaySetIndex(sets: RawSetRow[], index: number): number {
  const usesZeroBased = sets.every((set) => (set.set_index ?? 0) === 0);
  if (usesZeroBased) return index + 1;

  const raw = sets[index]?.set_index;
  if (raw == null || raw === 0) return index + 1;
  return raw;
}

export function buildInferredCycleWeekBySession(
  summaries: WorkoutHistorySession[],
): Map<
  string,
  { displayWeek: number | null; storedWeek: number | null; inferred: boolean }
> {
  const sorted = [...summaries].sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
  );

  const result = new Map<
    string,
    { displayWeek: number | null; storedWeek: number | null; inferred: boolean }
  >();

  let prev: WorkoutHistorySession | null = null;
  let inferred = 1;

  for (const session of sorted) {
    const storedWeek = session.cycleWeek;
    const maxWeeks = session.cycleWeeks ?? storedWeek ?? 1;

    if (!prev) {
      inferred = storedWeek ?? 1;
    } else if (isNewCycleRun(prev, session)) {
      inferred = storedWeek ?? 1;
    } else if (
      storedWeek != null &&
      prev.cycleWeek != null &&
      storedWeek > prev.cycleWeek
    ) {
      inferred = storedWeek;
    } else if (
      storedWeek != null &&
      prev.cycleWeek != null &&
      storedWeek === prev.cycleWeek &&
      maxWeeks > 1
    ) {
      const currCal = startOfWeek(parseISO(session.date), { weekStartsOn: 1 });
      const prevCal = startOfWeek(parseISO(prev.date), { weekStartsOn: 1 });
      if (currCal.getTime() > prevCal.getTime()) {
        inferred = Math.min(inferred + 1, maxWeeks);
      }
    } else if (storedWeek != null) {
      inferred = storedWeek;
    }

    const displayWeek = maxWeeks > 1 ? inferred : storedWeek;
    const inferredFlag = storedWeek != null && displayWeek !== storedWeek;

    result.set(session.id, {
      displayWeek,
      storedWeek,
      inferred: inferredFlag,
    });
    prev = session;
  }

  return result;
}

export function buildExerciseHistory(
  sessionRows: SessionWithExercises[],
  summaries: WorkoutHistorySession[],
  templateExercises: TemplateExercise[],
): WorkoutExerciseHistory[] {
  const summaryById = new Map(summaries.map((session) => [session.id, session]));
  const cycleWeekBySession = buildInferredCycleWeekBySession(summaries);
  const templateIds = new Set(templateExercises.map((exercise) => exercise.id));
  const templateNames = new Set(
    templateExercises.map((exercise) => exercise.name.toLowerCase()),
  );

  const exerciseMap = new Map<
    string,
    {
      name: string;
      orderIndex: number;
      isProgramExercise: boolean;
      rows: WorkoutExerciseSetRow[];
      sessionIds: Set<string>;
    }
  >();

  const templateOrderByName = new Map(
    templateExercises.map((exercise) => [
      exercise.name.toLowerCase(),
      exercise.order_index ?? 0,
    ]),
  );
  const templateOrderById = new Map(
    templateExercises.map((exercise) => [exercise.id, exercise.order_index ?? 0]),
  );

  for (const sessionRow of sessionRows) {
    const summary = summaryById.get(sessionRow.id);
    if (!summary) continue;

    const exercises = [...(sessionRow.session_exercises ?? [])].sort(
      (a, b) => a.order_index - b.order_index,
    );

    for (const exercise of exercises) {
      const key = exercise.name.toLowerCase();
      const isProgramExercise =
        !exercise.is_ad_hoc &&
        ((exercise.exercise_id != null && templateIds.has(exercise.exercise_id)) ||
          templateNames.has(key));
      const templateOrder =
        (exercise.exercise_id ? templateOrderById.get(exercise.exercise_id) : undefined) ??
        templateOrderByName.get(key) ??
        exercise.order_index + 1000;

      if (!exerciseMap.has(key)) {
        exerciseMap.set(key, {
          name: exercise.name,
          orderIndex: templateOrder,
          isProgramExercise,
          rows: [],
          sessionIds: new Set(),
        });
      }

      const entry = exerciseMap.get(key)!;
      entry.orderIndex = Math.min(entry.orderIndex, templateOrder);
      entry.isProgramExercise = entry.isProgramExercise || isProgramExercise;
      entry.sessionIds.add(sessionRow.id);

      const sets = [...(exercise.session_sets ?? [])].sort(
        (a, b) => (a.set_index ?? 0) - (b.set_index ?? 0),
      );

      const weekInfo = cycleWeekBySession.get(sessionRow.id);

      for (const [setPosition, set] of sets.entries()) {
        const e1rm =
          set.weight_used != null && set.reps_completed != null
            ? calculateE1RM(set.weight_used, set.reps_completed)
            : null;

        entry.rows.push({
          setId: set.id,
          sessionId: sessionRow.id,
          date: summary.date,
          cycleWeek: weekInfo?.displayWeek ?? summary.cycleWeek,
          storedCycleWeek: weekInfo?.storedWeek ?? summary.cycleWeek,
          cycleWeekInferred: weekInfo?.inferred ?? false,
          cycleWeeks: summary.cycleWeeks,
          setIndex: set.set_index ?? 0,
          displaySetIndex: resolveDisplaySetIndex(sets, setPosition),
          weightUsed: set.weight_used,
          repsCompleted: set.reps_completed,
          rpe: set.rpe,
          e1rm: e1rm && e1rm > 0 ? e1rm : null,
        });
      }
    }
  }

  return [...exerciseMap.values()]
    .map((entry) => {
      const rows = [...entry.rows].sort((a, b) => {
        const dateDiff = parseISO(a.date).getTime() - parseISO(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        if (a.sessionId !== b.sessionId) return a.sessionId.localeCompare(b.sessionId);
        return a.displaySetIndex - b.displaySetIndex;
      });

      const bestE1rm = rows.reduce<number | null>((best, row) => {
        if (row.e1rm == null) return best;
        return best == null ? row.e1rm : Math.max(best, row.e1rm);
      }, null);

      return {
        name: entry.name,
        orderIndex: entry.orderIndex,
        isProgramExercise: entry.isProgramExercise,
        rows,
        bestE1rm,
        sessionCount: entry.sessionIds.size,
      };
    })
    .sort((a, b) => {
      if (a.orderIndex !== b.orderIndex) return a.orderIndex - b.orderIndex;
      return a.name.localeCompare(b.name, 'fi');
    });
}

export function buildWorkoutHistoryData(
  sessions: SessionSummary[],
  meta: Omit<
    WorkoutHistoryMeta,
    'totalSessions' | 'avgRpe' | 'latestVolume' | 'currentWeek'
  >,
  options: {
    sessionRows?: SessionWithExercises[];
    templateExercises?: TemplateExercise[];
  } = {},
): WorkoutHistoryData {
  const enriched = enrichSessionsWithVolumeChange(sessions);
  const scheduled = enriched.filter((s) => s.cycleWeek != null);
  const unscheduled = enriched
    .filter((s) => s.cycleWeek == null)
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  const rpeValues = enriched
    .map((s) => s.rpeAverage)
    .filter((value): value is number => value != null);

  const latestSession = [...enriched].sort(
    (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
  )[0];

  const fullMeta: WorkoutHistoryMeta = {
    ...meta,
    totalSessions: enriched.length,
    avgRpe:
      rpeValues.length > 0
        ? Math.round((rpeValues.reduce((sum, value) => sum + value, 0) / rpeValues.length) * 10) /
          10
        : null,
    latestVolume: latestSession?.totalVolume ?? null,
    currentWeek: latestSession?.cycleWeek ?? null,
  };

  const cycleWeeks = meta.cycleWeeks ?? 1;
  const isFlatTimeline = cycleWeeks <= 1;

  const exercises =
    options.sessionRows && options.sessionRows.length > 0
      ? buildExerciseHistory(
          options.sessionRows,
          enriched,
          options.templateExercises ?? [],
        )
      : [];

  if (isFlatTimeline) {
    return {
      meta: fullMeta,
      cycleRuns: [],
      unscheduled,
      isFlatTimeline: true,
      flatSessions: [...enriched].sort(
        (a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime(),
      ),
      exercises,
    };
  }

  const cycleRuns = buildCycleRunGroups(
    scheduled,
    cycleWeeks,
    meta.programmedDeloads,
  );

  return {
    meta: fullMeta,
    cycleRuns,
    unscheduled,
    isFlatTimeline: false,
    flatSessions: [],
    exercises,
  };
}

type WorkoutHistorySessionRow = {
  id: string;
  date: string | null;
  duration: number | null;
  total_volume: number | null;
  feeling: number | null;
  rpe_average: number | null;
  heart_rate_avg: number | null;
  heart_rate_max: number | null;
  workout_id: string | null;
  cycle_week: number | null;
  workouts?: {
    program: string | null;
    workout_type: string | null;
    cycle_weeks?: number | null;
    programmed_deloads?: number[] | null;
  } | null;
  session_exercises?: RawSessionExercise[] | null;
};

export async function fetchWorkoutHistory(
  supabase: Awaited<
    ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>
  >,
  coachId: string,
  clientId: string,
  workoutId: string,
): Promise<WorkoutHistoryData | null> {
  const { data: workout } = await supabase
    .from('workouts')
    .select('id, program, workout_type, cycle_weeks, programmed_deloads, user_id')
    .eq('id', workoutId)
    .eq('user_id', clientId)
    .single();

  if (!workout) return null;

  const [{ data: sessionRows }, { data: templateExercises }] = await Promise.all([
    supabase
      .from('workout_sessions')
      .select(`
        id,
        date,
        duration,
        total_volume,
        feeling,
        rpe_average,
        heart_rate_avg,
        heart_rate_max,
        cycle_week,
        workout_id,
        workouts ( program, workout_type, cycle_weeks, programmed_deloads ),
        session_exercises (
          id,
          name,
          order_index,
          exercise_id,
          is_ad_hoc,
          session_sets (
            id,
            set_index,
            weight_used,
            reps_completed,
            rpe
          )
        )
      `)
      .eq('user_id', clientId)
      .eq('workout_id', workoutId)
      .order('date', { ascending: true }),
    supabase
      .from('exercises')
      .select('id, name, order_index')
      .eq('workout_id', workoutId)
      .order('order_index', { ascending: true }),
  ]);

  const rows = (sessionRows ?? []) as SessionWithExercises[];
  if (rows.length === 0) return null;

  const notedSessionIds = await fetchNotedSessionIds(
    supabase,
    coachId,
    rows.map((row) => row.id),
  );

  const summaries = formatSessionSummaries(rows, notedSessionIds);

  return buildWorkoutHistoryData(
    summaries,
    {
      workoutId,
      programName: workout.program ?? summaries[0]?.workoutName ?? 'Nimetön treeni',
      workoutType: workout.workout_type ?? summaries[0]?.workoutType ?? null,
      cycleWeeks: workout.cycle_weeks ?? summaries[0]?.cycleWeeks ?? null,
      programmedDeloads: workout.programmed_deloads ?? [],
    },
    {
      sessionRows: rows,
      templateExercises: templateExercises ?? [],
    },
  );
}
