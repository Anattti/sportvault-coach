-- Track who last edited a workout template and when

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.user_profiles(id);

UPDATE public.workouts w
SET
  updated_at = w.created_at,
  updated_by = w.user_id
WHERE w.updated_at IS NULL
  AND EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.id = w.user_id
  );

UPDATE public.workouts w
SET updated_at = w.created_at
WHERE w.updated_at IS NULL;

ALTER TABLE public.workouts
  ALTER COLUMN updated_at SET DEFAULT now();

CREATE OR REPLACE FUNCTION public.insert_workout_with_children(
  p_user_id uuid,
  p_program text,
  p_workout_type text,
  p_date timestamp with time zone,
  p_duration int,
  p_feeling int,
  p_notes text,
  p_progression text,
  p_progression_percentage text,
  p_exercises jsonb,
  p_deload_cycle smallint DEFAULT NULL,
  p_cycle_weeks integer DEFAULT 1,
  p_programmed_deloads integer[] DEFAULT '{}',
  p_managed_by_coach boolean DEFAULT false,
  p_source_template_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workout_id uuid;
  v_exercise_item jsonb;
  v_exercise_id uuid;
  v_set_item jsonb;
  v_set_idx int;
  v_cycle_week int;
  v_managed boolean;
  v_editor uuid;
BEGIN
  IF NOT public.can_manage_user_workouts(p_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  v_editor := (SELECT auth.uid());
  v_managed := p_managed_by_coach
    AND p_user_id <> v_editor;

  INSERT INTO public.workouts (
    user_id, program, workout_type, date, duration, feeling, notes,
    progression, progression_percentage, deload_cycle, cycle_weeks,
    programmed_deloads, managed_by_coach, source_template_id,
    updated_at, updated_by
  ) VALUES (
    p_user_id, p_program, p_workout_type, p_date, p_duration, p_feeling, p_notes,
    p_progression, p_progression_percentage, COALESCE(p_deload_cycle, 4),
    COALESCE(p_cycle_weeks, 1), COALESCE(p_programmed_deloads, '{}'),
    v_managed, p_source_template_id,
    now(), v_editor
  )
  RETURNING id INTO v_workout_id;

  IF jsonb_array_length(p_exercises) > 0 THEN
    FOR v_exercise_item IN SELECT * FROM jsonb_array_elements(p_exercises)
    LOOP
      INSERT INTO public.exercises (
        workout_id, name, category, order_index, notes
      ) VALUES (
        v_workout_id,
        v_exercise_item->>'name',
        v_exercise_item->>'category',
        COALESCE((v_exercise_item->>'order_index')::int, 0),
        v_exercise_item->>'notes'
      )
      RETURNING id INTO v_exercise_id;

      IF v_exercise_item->'sets' IS NOT NULL AND jsonb_array_length(v_exercise_item->'sets') > 0 THEN
        FOR v_set_item IN SELECT * FROM jsonb_array_elements(v_exercise_item->'sets')
        LOOP
          v_cycle_week := COALESCE((v_set_item->>'cycle_week')::int, 1);

          SELECT COALESCE(MAX(es.set_index), -1) + 1 INTO v_set_idx
          FROM public.exercise_sets es
          WHERE es.exercise_id = v_exercise_id AND es.cycle_week = v_cycle_week;

          INSERT INTO public.exercise_sets (
            exercise_id, sets, reps, weight, rest_time, rpe,
            is_bodyweight, target_type, set_index, cycle_week, notes
          ) VALUES (
            v_exercise_id,
            (v_set_item->>'sets')::int,
            (v_set_item->>'reps')::int,
            (v_set_item->>'weight')::numeric,
            COALESCE((v_set_item->>'rest_time')::int, (v_set_item->>'restTime')::int, 60),
            (v_set_item->>'rpe')::numeric,
            COALESCE((v_set_item->>'isBodyweight')::boolean, (v_set_item->>'weight')::numeric = 0),
            v_set_item->>'target_type',
            v_set_idx,
            v_cycle_week,
            v_set_item->>'notes'
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'workout_id', v_workout_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_workout_details(
  p_workout_id uuid,
  p_program text,
  p_workout_type text,
  p_notes text,
  p_exercises jsonb,
  p_deload_cycle smallint DEFAULT NULL,
  p_cycle_weeks integer DEFAULT NULL,
  p_programmed_deloads integer[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exercise_item jsonb;
  v_set_item jsonb;
  v_exercise_id uuid;
  v_exercise_ids uuid[];
  v_cycle_week int;
  v_set_idx int;
BEGIN
  IF NOT public.can_manage_workout(p_workout_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  UPDATE public.workouts
  SET
    program = p_program,
    workout_type = p_workout_type,
    notes = p_notes,
    deload_cycle = COALESCE(p_deload_cycle, deload_cycle),
    cycle_weeks = COALESCE(p_cycle_weeks, cycle_weeks),
    programmed_deloads = COALESCE(p_programmed_deloads, programmed_deloads),
    updated_at = now(),
    updated_by = (SELECT auth.uid())
  WHERE id = p_workout_id;

  v_exercise_ids := array[]::uuid[];

  IF jsonb_array_length(p_exercises) > 0 THEN
    FOR v_exercise_item IN SELECT * FROM jsonb_array_elements(p_exercises)
    LOOP
      v_exercise_id := null;
      BEGIN
        v_exercise_id := (v_exercise_item->>'id')::uuid;
        PERFORM 1 FROM public.exercises WHERE id = v_exercise_id AND workout_id = p_workout_id;
        IF NOT FOUND THEN
          v_exercise_id := null;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_exercise_id := null;
      END;

      IF v_exercise_id IS NOT NULL THEN
        UPDATE public.exercises
        SET
          name = v_exercise_item->>'name',
          category = v_exercise_item->>'category',
          order_index = (v_exercise_item->>'order_index')::int,
          notes = v_exercise_item->>'notes'
        WHERE id = v_exercise_id;
      ELSE
        INSERT INTO public.exercises (
          workout_id, name, category, order_index, notes
        ) VALUES (
          p_workout_id,
          v_exercise_item->>'name',
          v_exercise_item->>'category',
          (v_exercise_item->>'order_index')::int,
          v_exercise_item->>'notes'
        )
        RETURNING id INTO v_exercise_id;
      END IF;

      v_exercise_ids := array_append(v_exercise_ids, v_exercise_id);

      DELETE FROM public.exercise_sets WHERE exercise_id = v_exercise_id;

      IF v_exercise_item->'sets' IS NOT NULL AND jsonb_array_length(v_exercise_item->'sets') > 0 THEN
        FOR v_set_item IN SELECT * FROM jsonb_array_elements(v_exercise_item->'sets')
        LOOP
          v_cycle_week := COALESCE((v_set_item->>'cycle_week')::int, 1);

          SELECT COALESCE(MAX(es.set_index), -1) + 1 INTO v_set_idx
          FROM public.exercise_sets es
          WHERE es.exercise_id = v_exercise_id AND es.cycle_week = v_cycle_week;

          INSERT INTO public.exercise_sets (
            exercise_id, sets, reps, weight, rest_time, rpe,
            is_bodyweight, target_type, set_index, cycle_week, notes
          ) VALUES (
            v_exercise_id,
            (v_set_item->>'sets')::int,
            (v_set_item->>'reps')::int,
            (v_set_item->>'weight')::numeric,
            COALESCE((v_set_item->>'rest_time')::int, (v_set_item->>'restTime')::int, 60),
            (v_set_item->>'rpe')::numeric,
            COALESCE((v_set_item->>'isBodyweight')::boolean, (v_set_item->>'weight')::numeric = 0),
            v_set_item->>'target_type',
            v_set_idx,
            v_cycle_week,
            v_set_item->>'notes'
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  DELETE FROM public.exercises
  WHERE workout_id = p_workout_id
    AND id != ALL(v_exercise_ids);

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
