'use client';

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
import { ExerciseData, SetBlock } from '@/lib/types/workout';
import ExerciseItem from './ExerciseItem';

interface Props {
  exercises: ExerciseData[];
  setExercises: React.Dispatch<React.SetStateAction<ExerciseData[]>>;
  activeCycleWeek: number;
}

export default function ExerciseList({ exercises, setExercises, activeCycleWeek }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require moving 5px before drag starts (helps click vs drag)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    setExercises((prev) =>
      prev.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
  };

  const removeExercise = (id: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== id));
  };

  const addSetBlock = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          const weekBlocks = ex.setBlocks.filter((b) => (b.cycleWeek ?? 1) === activeCycleWeek);
          const lastBlock = weekBlocks[weekBlocks.length - 1] || ex.setBlocks[ex.setBlocks.length - 1];
          const maxWeek = Math.max(...ex.setBlocks.map(b => b.cycleWeek ?? 1), activeCycleWeek);
          
          const newBlocks = [...ex.setBlocks];
          for (let w = 1; w <= maxWeek; w++) {
            newBlocks.push({
              id: Math.random().toString(),
              reps: lastBlock?.reps || '',
              weight: lastBlock?.weight || '',
              restTime: lastBlock?.restTime || '60',
              targetRpe: lastBlock?.targetRpe || '',
              targetType: lastBlock?.targetType || 'reps',
              isBodyweight: lastBlock?.isBodyweight || false,
              cycleWeek: w,
              notes: '',
            });
          }
          
          return { ...ex, setBlocks: newBlocks };
        }
        return ex;
      })
    );
  };

  const removeSetBlock = (exerciseId: string, blockId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return { ...ex, setBlocks: ex.setBlocks.filter((b) => b.id !== blockId) };
        }
        return ex;
      })
    );
  };

  const updateSetBlock = <K extends keyof SetBlock>(exerciseId: string, blockId: string, field: K, value: SetBlock[K]) => {
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
      })
    );
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={exercises.map(e => e.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {exercises.map((exercise) => (
            <ExerciseItem 
              key={exercise.id} 
              exercise={exercise}
              activeCycleWeek={activeCycleWeek}
              updateExercise={updateExercise}
              removeExercise={removeExercise}
              updateSetBlock={updateSetBlock}
              removeSetBlock={removeSetBlock}
              addSetBlock={addSetBlock}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
