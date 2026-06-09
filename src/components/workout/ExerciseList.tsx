'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ExerciseData, SetBlock, WeekViewMode } from '@/lib/types/workout';
import { Button } from '@/components/ui/button';
import { ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import ExerciseItem from './ExerciseItem';

interface Props {
  exercises: ExerciseData[];
  setExercises: React.Dispatch<React.SetStateAction<ExerciseData[]>>;
  cycleWeeks: number;
  programmedDeloads: number[];
  activeCycleWeek: number;
  weekViewMode: WeekViewMode;
  syncSetsAcrossWeeks: boolean;
}

function buildDefaultCollapsedWeeks(cycleWeeks: number, activeCycleWeek: number): Set<number> {
  const collapsed = new Set<number>();
  for (let week = 1; week <= cycleWeeks; week++) {
    if (week !== activeCycleWeek) collapsed.add(week);
  }
  return collapsed;
}

export default function ExerciseList({
  exercises,
  setExercises,
  cycleWeeks,
  programmedDeloads,
  activeCycleWeek,
  weekViewMode,
  syncSetsAcrossWeeks,
}: Props) {
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<number>>(() =>
    buildDefaultCollapsedWeeks(cycleWeeks, activeCycleWeek),
  );
  const prevCycleWeeksRef = useRef(cycleWeeks);

  const effectiveCollapsedWeeks = (() => {
    if (weekViewMode === 'focused') return collapsedWeeks;
    const next = new Set(collapsedWeeks);
    next.delete(activeCycleWeek);
    for (const week of next) {
      if (week > cycleWeeks) next.delete(week);
    }
    return next;
  })();

  useEffect(() => {
    const prevWeeks = prevCycleWeeksRef.current;
    if (cycleWeeks === prevWeeks) return;

    if (cycleWeeks < prevWeeks) {
      setCollapsedWeeks((prev) => {
        const next = new Set<number>();
        for (const week of prev) {
          if (week <= cycleWeeks) next.add(week);
        }
        return next;
      });
    } else {
      setCollapsedWeeks((prev) => {
        const next = new Set(prev);
        for (let week = prevWeeks + 1; week <= cycleWeeks; week++) {
          next.add(week);
        }
        next.delete(activeCycleWeek);
        return next;
      });
    }

    prevCycleWeeksRef.current = cycleWeeks;
  }, [cycleWeeks, activeCycleWeek]);

  const toggleWeek = (week: number) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) {
        next.delete(week);
      } else {
        next.add(week);
      }
      return next;
    });
  };

  const expandAllWeeks = () => setCollapsedWeeks(new Set());
  const collapseAllWeeks = () =>
    setCollapsedWeeks(new Set(Array.from({ length: cycleWeeks }, (_, index) => index + 1)));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateExercise = <K extends keyof ExerciseData>(id: string, field: K, value: ExerciseData[K]) => {
    setExercises((prev) => prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex)));
  };

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const addSetBlock = (exerciseId: string, sourceCycleWeek?: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;

        const templateWeek = sourceCycleWeek ?? activeCycleWeek;
        const weekBlocks = ex.setBlocks.filter((b) => (b.cycleWeek ?? 1) === templateWeek);
        const lastBlock = weekBlocks[weekBlocks.length - 1] || ex.setBlocks[ex.setBlocks.length - 1];

        const newBlockForWeek = (week: number): SetBlock => ({
          id: Math.random().toString(),
          reps: lastBlock?.reps || '',
          weight: lastBlock?.weight || '',
          restTime: lastBlock?.restTime || '60',
          targetRpe: lastBlock?.targetRpe || '',
          targetType: lastBlock?.targetType || 'reps',
          isBodyweight: lastBlock?.isBodyweight || false,
          cycleWeek: week,
          notes: '',
        });

        const newBlocks = [...ex.setBlocks];

        if (syncSetsAcrossWeeks) {
          for (let w = 1; w <= cycleWeeks; w++) {
            newBlocks.push(newBlockForWeek(w));
          }
        } else {
          newBlocks.push(newBlockForWeek(templateWeek));
        }

        return { ...ex, setBlocks: newBlocks };
      }),
    );
  };

  const removeSetBlock = (exerciseId: string, blockId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return { ...ex, setBlocks: ex.setBlocks.filter((b) => b.id !== blockId) };
        }
        return ex;
      }),
    );
  };

  const updateSetBlock = <K extends keyof SetBlock>(
    exerciseId: string,
    blockId: string,
    field: K,
    value: SetBlock[K],
  ) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          const newBlocks = ex.setBlocks.map((b) => {
            if (b.id === blockId) {
              return { ...b, [field]: value };
            }
            return b;
          });
          return { ...ex, setBlocks: newBlocks };
        }
        return ex;
      }),
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {cycleWeeks > 1 && weekViewMode === 'all' && (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={expandAllWeeks}
            className="border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
          >
            <ChevronsUpDown className="mr-1.5 h-3.5 w-3.5" />
            Laajenna kaikki
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={collapseAllWeeks}
            className="border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
          >
            <ChevronsDownUp className="mr-1.5 h-3.5 w-3.5" />
            Pienennä kaikki
          </Button>
        </div>
      )}

      <SortableContext items={exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {exercises.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center text-sm text-muted-foreground">
              Ei liikkeitä vielä. Lisää ensimmäinen liike alapuolelta tai historiasta.
            </div>
          ) : (
            exercises.map((exercise) => (
              <ExerciseItem
                key={exercise.id}
                exercise={exercise}
                cycleWeeks={cycleWeeks}
                programmedDeloads={programmedDeloads}
                activeCycleWeek={activeCycleWeek}
                weekViewMode={weekViewMode}
                collapsedWeeks={effectiveCollapsedWeeks}
                onToggleWeek={toggleWeek}
                updateExercise={updateExercise}
                removeExercise={removeExercise}
                updateSetBlock={updateSetBlock}
                removeSetBlock={removeSetBlock}
                addSetBlock={addSetBlock}
              />
            ))
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}
