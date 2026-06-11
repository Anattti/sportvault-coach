export type ClientSessionRow = {
  id: string;
  user_id: string | null;
  workout_id: string | null;
  date: string | null;
  duration: number | null;
  total_volume: number | null;
  feeling?: number | null;
  rpe_average: number | null;
  heart_rate_avg?: number | null;
  heart_rate_max?: number | null;
  notes?: string | null;
  cycle_week: number | null;
  is_deload: boolean | null;
  workouts?: {
    program: string | null;
    workout_type: string | null;
    cycle_weeks: number | null;
    programmed_deloads: number[] | null;
  } | null;
  session_exercises: Array<{
    id: string;
    name: string;
    exercise_id: string | null;
    is_ad_hoc: boolean | null;
    is_swapped: boolean | null;
    notes?: string | null;
    session_sets: Array<{
      weight_used: number | null;
      reps_completed: number | null;
      rpe: number | null;
      notes?: string | null;
    }> | null;
  }> | null;
};

export type PrescriptionExerciseRow = {
  id: string;
  name: string;
  exercise_sets: Array<{
    cycle_week: number;
    weight: number;
    reps: number;
    sets: number;
    rpe: number | null;
  }> | null;
};
