'use client';

import { parseISO } from 'date-fns';
import { ChevronRight, Dumbbell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDateFi } from '@/lib/dates/fi';
import { WorkoutProgramSummary } from '@/lib/sessions/workout-programs';
import SessionCycleBadge from '@/components/sessions/SessionCycleBadge';
import { cn } from '@/lib/utils';

interface WorkoutProgramPickerProps {
  programs: WorkoutProgramSummary[];
  selectedWorkoutId: string | null;
  onSelect: (workoutId: string) => void;
  activeWorkoutId?: string;
  onCopyBlank?: (workoutId: string) => void;
}

export default function WorkoutProgramPicker({
  programs,
  selectedWorkoutId,
  onSelect,
  activeWorkoutId,
  onCopyBlank,
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
          <div
            key={program.workoutId}
            className={cn(
              'flex w-full items-center gap-1 transition-colors',
              isSelected ? 'bg-primary/10' : 'hover:bg-white/[0.04]',
            )}
          >
          <button
            type="button"
            onClick={() => onSelect(program.workoutId)}
            className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left"
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
          {onCopyBlank && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title="Kopioi pohja blankkona"
              onClick={(e) => {
                e.stopPropagation();
                onCopyBlank(program.workoutId);
              }}
              className="mr-2 h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          </div>
        );
      })}
    </div>
  );
}
