-- Coach invitation RPCs (shared with Sportvault-mobile)

CREATE OR REPLACE FUNCTION public.get_coach_invitation_preview(p_invite_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation record;
BEGIN
  SELECT ci.*, up.nickname, cp.business_name
  INTO v_invitation
  FROM public.coach_invitations ci
  JOIN public.user_profiles up ON up.id = ci.coach_id
  LEFT JOIN public.coach_profiles cp ON cp.id = ci.coach_id
  WHERE ci.invite_code = p_invite_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_not_found');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'coach_name', COALESCE(v_invitation.nickname, 'Valmentaja'),
    'business_name', v_invitation.business_name,
    'expires_at', v_invitation.expires_at,
    'is_valid',
      v_invitation.used_at IS NULL
      AND v_invitation.expires_at > now(),
    'client_email', v_invitation.client_email
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_coach_invitation_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_coach_invitation_preview(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_coach_invitation(p_invite_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_invitation record;
  v_relationship_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_invitation
  FROM public.coach_invitations
  WHERE invite_code = p_invite_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_not_found');
  END IF;

  IF v_invitation.used_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_already_used');
  END IF;

  IF v_invitation.expires_at <= now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_expired');
  END IF;

  IF v_invitation.client_email IS NOT NULL
     AND lower(trim(v_invitation.client_email)) <> lower(trim((SELECT email FROM auth.users WHERE id = v_uid))) THEN
    RETURN jsonb_build_object('success', false, 'error', 'email_mismatch');
  END IF;

  IF v_invitation.coach_id = v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'cannot_accept_own_invitation');
  END IF;

  INSERT INTO public.coach_clients (coach_id, client_id, status, invited_at, accepted_at)
  VALUES (v_invitation.coach_id, v_uid, 'active', v_invitation.created_at, now())
  ON CONFLICT (coach_id, client_id) DO UPDATE
    SET status = 'active',
        accepted_at = COALESCE(public.coach_clients.accepted_at, now())
  RETURNING id INTO v_relationship_id;

  UPDATE public.coach_invitations
  SET used_at = now()
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object(
    'success', true,
    'coach_id', v_invitation.coach_id,
    'relationship_id', v_relationship_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_coach_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_coach_invitation(text) TO authenticated;
