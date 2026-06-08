'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { parseISO } from 'date-fns';
import { BatteryLow, Dumbbell, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { formatCycleWeekLabel } from '@/lib/sessions/format';
import { formatDateFi } from '@/lib/dates/fi';
import { primaryActiveClassName } from '@/config/navigation';
import RpeBadge from '@/components/sessions/RpeBadge';
import { WorkoutExerciseHistory, WorkoutExerciseSetRow, WorkoutHistoryData } from '@/types';
import { cn } from '@/lib/utils';

interface WorkoutHistoryTimelineProps {
  data: WorkoutHistoryData;
  clientId: string;
}

type ExerciseFilter = 'all' | 'program';

const filterOptions: Array<{ value: ExerciseFilter; label: string }> = [
  { value: 'all', label: 'Kaikki' },
  { value: 'program', label: 'Jakson liikkeet' },
];

function hasMultiWeekProgram(cycleWeeks: number | null): boolean {
  return cycleWeeks != null && cycleWeeks > 2;
}

function isFirstRowOfSession(rows: WorkoutExerciseSetRow[], index: number): boolean {
  if (index === 0) return true;
  return rows[index].sessionId !== rows[index - 1].sessionId;
}

function getSessionBlockIndex(rows: WorkoutExerciseSetRow[], index: number): number {
  let block = 0;
  for (let i = 1; i <= index; i++) {
    if (rows[i].sessionId !== rows[i - 1].sessionId) block++;
  }
  return block;
}

function buildSessionWeightChangePercent(
  rows: WorkoutExerciseSetRow[],
): Map<string, number | null> {
  const sessionOrder: string[] = [];
  const maxWeightBySession = new Map<string, number>();

  for (const row of rows) {
    if (!sessionOrder.includes(row.sessionId)) {
      sessionOrder.push(row.sessionId);
    }
    if (row.weightUsed == null) continue;
    const current = maxWeightBySession.get(row.sessionId) ?? 0;
    maxWeightBySession.set(row.sessionId, Math.max(current, row.weightUsed));
  }

  const changes = new Map<string, number | null>();
  for (let i = 1; i < sessionOrder.length; i++) {
    const sessionId = sessionOrder[i];
    const prevMax = maxWeightBySession.get(sessionOrder[i - 1]);
    const currMax = maxWeightBySession.get(sessionId);
    if (prevMax == null || currMax == null || prevMax <= 0) {
      changes.set(sessionId, null);
      continue;
    }
    changes.set(sessionId, Math.round(((currMax - prevMax) / prevMax) * 1000) / 10);
  }

  return changes;
}

function WeekBadge({
  row,
  isDeload,
}: {
  row: WorkoutExerciseSetRow;
  isDeload: boolean;
}) {
  const label = formatCycleWeekLabel(row.cycleWeek, row.cycleWeeks);
  if (!label) return <span className="text-muted-foreground/50">—</span>;

  return (
    <span
      title={
        row.cycleWeekInferred && row.storedCycleWeek != null
          ? `Päätelty viikko (tallennettu ${formatCycleWeekLabel(row.storedCycleWeek, row.cycleWeeks) ?? row.storedCycleWeek})`
          : isDeload
            ? 'Deload-viikko'
            : undefined
      }
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold tabular-nums',
        isDeload
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
          : row.cycleWeekInferred
            ? 'border-primary/25 bg-primary/10 text-primary'
            : 'border-cyan-500/20 bg-cyan-500/10 text-cyan-200',
      )}
    >
      {isDeload && <BatteryLow className="h-3 w-3 shrink-0" aria-hidden="true" />}
      {label}
      {row.cycleWeekInferred && (
        <span className="text-[9px] opacity-70" aria-hidden="true">
          *
        </span>
      )}
    </span>
  );
}

function WeightChangeChip({ percent }: { percent: number | null }) {
  if (percent == null || percent === 0) return null;

  const isUp = percent > 0;
  const Icon = isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        'ml-1.5 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
        isUp ? 'bg-primary/10 text-primary' : 'bg-orange-500/10 text-orange-300',
      )}
    >
      <Icon className="mr-0.5 h-3 w-3" />
      {isUp ? '+' : ''}
      {percent} %
    </span>
  );
}

function TableLegend({ showInferredNote }: { showInferredNote: boolean }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-white/8 bg-white/[0.02] px-4 py-2.5 text-[10px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-3 w-1 rounded-full bg-primary/60" aria-hidden="true" />
        Uusi treeni
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex h-4 items-center rounded border border-cyan-500/20 bg-cyan-500/10 px-1 text-[9px] font-semibold text-cyan-200">
          2/4
        </span>
        Viikko
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Trophy className="h-3 w-3 text-primary" aria-hidden="true" />
        Ennätys e1RM
      </span>
      {showInferredNote && (
        <span>
          <span className="text-primary">*</span> = viikko päätelty
        </span>
      )}
    </div>
  );
}

function ExerciseHistoryTable({
  exercise,
  clientId,
  programmedDeloads,
  showInferredNote,
}: {
  exercise: WorkoutExerciseHistory;
  clientId: string;
  programmedDeloads: number[];
  showInferredNote: boolean;
}) {
  const sessionWeightChanges = useMemo(
    () => buildSessionWeightChangePercent(exercise.rows),
    [exercise.rows],
  );

  return (
    <section
      aria-labelledby={`exercise-${exercise.name}`}
      className="glass-panel rounded-2xl overflow-hidden"
    >
      <div className="flex flex-col gap-2 border-b border-white/8 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Dumbbell className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3
              id={`exercise-${exercise.name}`}
              className="truncate text-base font-semibold text-foreground"
            >
              {exercise.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {exercise.sessionCount}{' '}
              {exercise.sessionCount === 1 ? 'suoritus' : 'suoritusta'}
              {exercise.bestE1rm != null && (
                <span className="text-primary/80">
                  {' '}
                  · Ennätys {exercise.bestE1rm} kg
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="sticky top-0 z-10 border-b border-white/8 bg-[#121212]/95 text-left text-[11px] uppercase tracking-wider text-muted-foreground backdrop-blur-md">
              <th className="px-4 py-3 font-medium">Viikko</th>
              <th className="px-3 py-3 font-medium">Päivä</th>
              <th className="px-3 py-3 font-medium">Sarja</th>
              <th className="px-3 py-3 font-medium">Paino</th>
              <th className="px-3 py-3 font-medium">Toistot</th>
              <th className="px-3 py-3 font-medium">RPE</th>
              <th className="hidden sm:table-cell px-4 py-3 font-medium">e1RM</th>
            </tr>
          </thead>
          <tbody>
            {exercise.rows.map((row, index) => {
              const isSessionStart = isFirstRowOfSession(exercise.rows, index);
              const sessionBlock = getSessionBlockIndex(exercise.rows, index);
              const isBestSet =
                row.e1rm != null && exercise.bestE1rm != null && row.e1rm === exercise.bestE1rm;
              const isDeload =
                row.cycleWeek != null && programmedDeloads.includes(row.cycleWeek);
              const weightChange = isSessionStart
                ? sessionWeightChanges.get(row.sessionId) ?? null
                : null;

              return (
                <tr
                  key={row.setId}
                  className={cn(
                    'border-b border-white/5 transition-colors',
                    sessionBlock % 2 === 0 ? 'bg-white/[0.015]' : 'bg-transparent',
                    isBestSet && 'bg-primary/[0.04]',
                    isSessionStart && 'border-l-2 border-l-primary/35',
                    'hover:bg-white/[0.04]',
                  )}
                >
                  <td className="px-4 py-3">
                    {isSessionStart ? (
                      <WeekBadge row={row} isDeload={isDeload} />
                    ) : (
                      <span className="text-muted-foreground/20" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {isSessionStart ? (
                      <span className="inline-flex flex-wrap items-center">
                        <Link
                          href={`/clients/${clientId}/sessions/${row.sessionId}`}
                          className="font-medium tabular-nums text-foreground transition-colors hover:text-primary hover:underline"
                        >
                          {formatDateFi(parseISO(row.date))}
                        </Link>
                        <WeightChangeChip percent={weightChange} />
                      </span>
                    ) : (
                      <span className="text-muted-foreground/20" aria-hidden="true">
                        ·
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] text-xs font-semibold tabular-nums text-muted-foreground ring-1 ring-white/8">
                      {row.displaySetIndex}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums text-foreground">
                    {row.weightUsed != null ? `${row.weightUsed} kg` : '—'}
                  </td>
                  <td className="px-3 py-3 font-semibold tabular-nums text-foreground/90">
                    {row.repsCompleted != null ? row.repsCompleted : '—'}
                  </td>
                  <td className="px-3 py-3">
                    {row.rpe != null ? <RpeBadge rpe={row.rpe} size="md" /> : '—'}
                  </td>
                  <td className="hidden sm:table-cell px-4 py-3">
                    {row.e1rm != null ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 tabular-nums',
                          isBestSet
                            ? 'font-semibold text-primary'
                            : 'text-muted-foreground',
                        )}
                      >
                        {isBestSet && (
                          <Trophy className="h-3.5 w-3.5 shrink-0" aria-label="Ennätys" />
                        )}
                        {row.e1rm} kg
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TableLegend showInferredNote={showInferredNote} />
    </section>
  );
}

export default function WorkoutHistoryTimeline({
  data,
  clientId,
}: WorkoutHistoryTimelineProps) {
  const { meta, exercises } = data;
  const showCycleFilter = hasMultiWeekProgram(meta.cycleWeeks);
  const [filter, setFilter] = useState<ExerciseFilter>(() =>
    showCycleFilter && exercises.some((exercise) => exercise.isProgramExercise)
      ? 'program'
      : 'all',
  );

  const activeFilter: ExerciseFilter = showCycleFilter ? filter : 'all';

  const filteredExercises = useMemo(() => {
    if (activeFilter === 'all') return exercises;
    return exercises.filter((exercise) => exercise.isProgramExercise);
  }, [exercises, activeFilter]);

  const programExerciseCount = useMemo(
    () => exercises.filter((exercise) => exercise.isProgramExercise).length,
    [exercises],
  );

  if (meta.totalSessions === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground">
        <p>Ei suorituksia tälle treenille.</p>
        <Link
          href={`/clients/${clientId}/programs`}
          className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
        >
          Siirry ohjelmiin
        </Link>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground">
        <p>Ei liiketietoja tälle treenille.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="px-1 text-sm text-muted-foreground">
          {filteredExercises.length}{' '}
          {filteredExercises.length === 1 ? 'liike' : 'liikettä'}
          {activeFilter === 'program' && ' ohjelmasta'}
        </p>
        {showCycleFilter && (
          <div className="flex flex-wrap gap-1.5 rounded-lg bg-white/5 p-1 ring-1 ring-white/8">
            {filterOptions.map((option) => {
              const isActive = filter === option.value;
              const isDisabled =
                option.value === 'program' && programExerciseCount === 0;

              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                    isActive
                      ? primaryActiveClassName
                      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                    isDisabled && 'cursor-not-allowed opacity-40',
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {filteredExercises.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-muted-foreground">
          <p>Ei jakson liikkeitä valitulla suodattimella.</p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Näytä kaikki
          </button>
        </div>
      ) : (
        filteredExercises.map((exercise) => (
          <ExerciseHistoryTable
            key={exercise.name}
            exercise={exercise}
            clientId={clientId}
            programmedDeloads={meta.programmedDeloads}
            showInferredNote={showCycleFilter}
          />
        ))
      )}
    </div>
  );
}
