'use client';

import { parseISO } from 'date-fns';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { formatDateFi } from '@/lib/dates/fi';
import { WorkoutProgramSummary } from '@/lib/sessions/workout-programs';
import SessionCycleBadge from '@/components/sessions/SessionCycleBadge';
import { cn } from '@/lib/utils';

interface WorkoutProgramPickerProps {
  programs: WorkoutProgramSummary[];
  selectedWorkoutId: string | null;
  onSelect: (workoutId: string) => void;
  activeWorkoutId?: string;
}

export default function WorkoutProgramPicker({
  programs,
  selectedWorkoutId,
  onSelect,
  activeWorkoutId,
}: WorkoutProgramPickerProps) {
  if (programs.length === 0) {
    return (
      <p className="px-1 text-xs text-muted-foreground">Ei ohjelmoituja treenejä historiassa.</p>
    );
  }

  return (
    <div className="divide-y divide-white/5 overflow-hidden rounded-xl ring-1 ring-white/8">
      {programs.map((program) => {
        const isSelected = program.workoutId === selectedWorkoutId;
        const isActive = program.workoutId === activeWorkoutId;
        const latest = program.latestSession;
        const date = parseISO(latest.date);

        return (
          <button
            key={program.workoutId}
            type="button"
            onClick={() => onSelect(program.workoutId)}
            className={cn(
              'flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors',
              isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-white/[0.04]',
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/8">
              <Dumbbell className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-medium text-foreground">{program.workoutName}</p>
                {isActive && (
                  <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                    Muokattava
                  </span>
                )}
                <SessionCycleBadge
                  cycleWeek={latest.cycleWeek}
                  cycleWeeks={latest.cycleWeeks}
                  className="text-[9px]"
                />
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {program.sessionCount}{' '}
                {program.sessionCount === 1 ? 'suoritus' : 'suoritusta'}
                <span> · Viimeisin {formatDateFi(date)}</span>
              </p>
            </div>
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 shrink-0',
                isSelected ? 'text-primary' : 'text-muted-foreground',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
