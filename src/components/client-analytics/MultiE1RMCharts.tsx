'use client';

import { useMemo, useState } from 'react';
import E1RMChart from '@/components/analytics/E1RMChart';
import { ExerciseProgressRow } from '@/types';
import { cn } from '@/lib/utils';

interface MultiE1RMChartsProps {
  exercises: ExerciseProgressRow[];
  defaultCount?: number;
}

export default function MultiE1RMCharts({
  exercises,
  defaultCount = 3,
}: MultiE1RMChartsProps) {
  const selectable = exercises.filter((e) => (e.history?.length ?? 0) >= 2);
  const [selected, setSelected] = useState<string[]>(() =>
    selectable.slice(0, defaultCount).map((e) => e.exerciseName),
  );

  const selectedExercises = useMemo(
    () => selectable.filter((e) => selected.includes(e.exerciseName)),
    [selectable, selected],
  );

  const toggle = (name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((n) => n !== name);
      if (prev.length >= 4) return prev;
      return [...prev, name];
    });
  };

  if (selectable.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold">e1RM-kaaviot</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Valitse enintään 4 liikettä (väh. 2 treeniä)
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {selectable.map((ex) => {
            const isSelected = selected.includes(ex.exerciseName);
            return (
              <button
                key={ex.exerciseName}
                type="button"
                onClick={() => toggle(ex.exerciseName)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-neon-sm'
                    : 'bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground',
                )}
              >
                {ex.exerciseName}
              </button>
            );
          })}
        </div>
      </div>
      {selectedExercises.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {selectedExercises.map((ex) => (
            <E1RMChart
              key={ex.exerciseName}
              exerciseName={ex.exerciseName}
              data={ex.history ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
