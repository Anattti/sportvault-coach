import type React from 'react';

export type TargetType = 'reps' | 'meters' | 'seconds';

export interface SetBlock {
  id: string;
  reps: string;
  weight: string;
  restTime: string;
  targetType: TargetType;
  isBodyweight: boolean;
  targetRpe?: string;
  cycleWeek?: number;
  notes?: string;
}

export interface ExerciseData {
  id: string;
  name: string;
  category: string;
  setBlocks: SetBlock[];
  notes?: string;
}

export interface WorkoutTypeOption {
  id: string;
  label: string;
  icon?: React.ElementType; // To hold Lucide icon component
  color: string;
}

export interface ExerciseCategory {
  id: string;
  label: string;
  icon?: React.ElementType;
}

export type WeekViewMode = 'focused' | 'all';

export interface ApplyExerciseFromHistoryPayload {
  name: string;
  sets: Array<{
    weight: string;
    reps: string;
    targetRpe?: string;
    restTime?: string;
    isBodyweight?: boolean;
    targetType?: TargetType;
  }>;
}
