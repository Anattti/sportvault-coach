'use client';

import { useMemo, useState } from 'react';
import { parseISO } from 'date-fns';
import { ChevronRight, Dumbbell, Search } from 'lucide-react';
import { formatDateFi } from '@/lib/dates/fi';
import { ExerciseOption } from '@/lib/sessions/exercise-history';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ExercisePickerProps {
  exercises: ExerciseOption[];
  selectedExerciseName: string | null;
  onSelect: (exerciseName: string) => void;
  suggestedNames?: string[];
}

export default function ExercisePicker({
  exercises,
  selectedExerciseName,
  onSelect,
  suggestedNames = [],
}: ExercisePickerProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? exercises.filter((ex) => ex.name.toLowerCase().includes(q))
      : exercises;

    if (suggestedNames.length === 0) return list;

    const suggestedSet = new Set(suggestedNames.map((n) => n.toLowerCase()));
    return [...list].sort((a, b) => {
      const aSuggested = suggestedSet.has(a.name.toLowerCase());
      const bSuggested = suggestedSet.has(b.name.toLowerCase());
      if (aSuggested !== bSuggested) return aSuggested ? -1 : 1;
      return parseISO(b.lastDate).getTime() - parseISO(a.lastDate).getTime();
    });
  }, [exercises, query, suggestedNames]);

  if (exercises.length === 0) {
    return (
      <p className="px-1 text-xs text-muted-foreground">Ei liikehistoriaa vielä.</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Hae liikettä..."
          className="h-9 rounded-xl border-white/10 bg-black/20 pl-9 text-sm"
        />
      </div>

      <div className="max-h-48 divide-y divide-white/5 overflow-y-auto rounded-xl ring-1 ring-white/8">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            Ei tuloksia haulle &quot;{query}&quot;
          </p>
        ) : (
          filtered.map((exercise) => {
            const isSelected = exercise.name === selectedExerciseName;
            const isSuggested = suggestedNames.some(
              (name) => name.toLowerCase() === exercise.name.toLowerCase(),
            );

            return (
              <button
                key={exercise.name}
                type="button"
                onClick={() => onSelect(exercise.name)}
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
                    <p className="truncate text-sm font-medium text-foreground">{exercise.name}</p>
                    {isSuggested && (
                      <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                        Ohjelmassa
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {exercise.sessionCount}{' '}
                    {exercise.sessionCount === 1 ? 'treeni' : 'treeniä'}
                    <span> · {formatDateFi(parseISO(exercise.lastDate))}</span>
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
          })
        )}
      </div>
    </div>
  );
}
