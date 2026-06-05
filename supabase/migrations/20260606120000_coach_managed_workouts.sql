-- Sync coach-managed workout flag and skip auto template updates for coach programs

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS managed_by_coach boolean NOT NULL DEFAULT false;

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS source_template_id uuid REFERENCES public.workouts(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.update_template_from_session(
  p_workout_id uuid,
  p_session_id uuid,
  p_cycle_week integer DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exercise record;
  v_session_exercise_id uuid;
  v_session_set record;
  v_set_index int;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.workouts
    WHERE id = p_workout_id AND managed_by_coach = true
  ) THEN
    RETURN jsonb_build_object('success', true, 'skipped', true);
  END IF;

  FOR v_exercise IN
    SELECT e.id, e.name, e.order_index
    FROM public.exercises e
    WHERE e.workout_id = p_workout_id
    ORDER BY e.order_index
  LOOP
    SELECT se.id INTO v_session_exercise_id
    FROM public.session_exercises se
    WHERE se.session_id = p_session_id
      AND se.name = v_exercise.name
      AND COALESCE(se.is_ad_hoc, false) = false
      AND COALESCE(se.is_swapped, false) = false
    ORDER BY se.order_index
    LIMIT 1;

    IF v_session_exercise_id IS NOT NULL THEN
      DELETE FROM public.exercise_sets
      WHERE exercise_id = v_exercise.id AND cycle_week = p_cycle_week;

      v_set_index := 0;
      FOR v_session_set IN
        SELECT ss.*
        FROM public.session_sets ss
        WHERE ss.session_exercise_id = v_session_exercise_id
        ORDER BY COALESCE(ss.set_index, 0), ss.created_at
      LOOP
        INSERT INTO public.exercise_sets (
          exercise_id, sets, reps, weight, rest_time, rpe,
          is_bodyweight, target_type, set_index, cycle_week
        ) VALUES (
          v_exercise.id,
          1,
          v_session_set.reps_completed,
          COALESCE(v_session_set.weight_used, 0),
          COALESCE(v_session_set.rest_time_taken, 60),
          v_session_set.rpe,
          false,
          'reps',
          v_set_index,
          p_cycle_week
        );
        v_set_index := v_set_index + 1;
      END LOOP;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN others THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
