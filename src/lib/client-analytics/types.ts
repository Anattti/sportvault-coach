export type ClientSessionRow = {
  id: string;
  user_id: string | null;
  workout_id: string | null;
  date: string | null;
  duration: number | null;
  total_volume: number | null;
  rpe_average: number | null;
  cycle_week: number | null;
  is_deload: boolean | null;
  workouts?: { workout_type: string | null } | null;
  session_exercises: Array<{
    id: string;
    name: string;
    exercise_id: string | null;
    is_ad_hoc: boolean | null;
    is_swapped: boolean | null;
    session_sets: Array<{
      weight_used: number | null;
      reps_completed: number | null;
      rpe: number | null;
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
