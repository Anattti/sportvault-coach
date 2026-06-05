-- Allow existing athlete users to activate coach capabilities without changing role

CREATE OR REPLACE FUNCTION public.activate_coach_profile(
  p_business_name text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;

  INSERT INTO public.user_profiles (id, role)
  VALUES (v_uid, 'athlete')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.coach_profiles (id, business_name)
  VALUES (v_uid, p_business_name)
  ON CONFLICT (id) DO UPDATE SET
    business_name = COALESCE(EXCLUDED.business_name, coach_profiles.business_name),
    updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.activate_coach_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_coach_profile(text) TO authenticated;
