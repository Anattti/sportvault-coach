-- ============================================================
-- 1. Roolikenttä profiiliin
-- ============================================================
ALTER TABLE user_profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'athlete'
  CHECK (role IN ('athlete', 'coach'));

-- ============================================================
-- 2. Valmentajan profiilitiedot
-- ============================================================
CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  max_clients INTEGER DEFAULT 10,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
  subscription_plan TEXT DEFAULT 'starter'
    CHECK (subscription_plan IN ('starter', 'pro', 'enterprise')),
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_own_profile" ON coach_profiles
  FOR ALL USING (id = auth.uid());

-- ============================================================
-- 3. Valmentaja-urheilija -suhde
-- ============================================================
CREATE TABLE coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'paused', 'ended')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(coach_id, client_id)
);

ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;

-- Valmentaja näkee ja hallitsee omat asiakassuhteensa
CREATE POLICY "coach_manage_clients" ON coach_clients
  FOR ALL USING (coach_id = auth.uid());

-- Urheilija näkee oman suhteensa (hyväksymistä/poistoa varten)
CREATE POLICY "client_view_own" ON coach_clients
  FOR SELECT USING (client_id = auth.uid());

CREATE INDEX idx_coach_clients_coach ON coach_clients(coach_id, status);
CREATE INDEX idx_coach_clients_client ON coach_clients(client_id, status);

-- ============================================================
-- 4. Valmentajan muistiinpanot treenisessioihin
-- ============================================================
CREATE TABLE coach_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coach_id, session_id)
);

ALTER TABLE coach_session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manage_notes" ON coach_session_notes
  FOR ALL USING (coach_id = auth.uid());

-- Urheilija näkee omiin sessioihin kohdistuvat muistiinpanot
CREATE POLICY "client_view_notes" ON coach_session_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      WHERE ws.id = coach_session_notes.session_id
        AND ws.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. Valmentajan muistiinpanot yksittäisiin liikkeisiin
-- ============================================================
CREATE TABLE coach_exercise_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_exercise_id UUID NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coach_id, session_exercise_id)
);

ALTER TABLE coach_exercise_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manage_exercise_notes" ON coach_exercise_notes
  FOR ALL USING (coach_id = auth.uid());

-- ============================================================
-- 6. Kutsulinkit
-- ============================================================
CREATE TABLE coach_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  client_email TEXT,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE coach_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manage_invitations" ON coach_invitations
  FOR ALL USING (coach_id = auth.uid());

-- ============================================================
-- 7. Treeniohjelma-assignointi (valmentaja → asiakas)
-- ============================================================
CREATE TABLE coach_program_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  UNIQUE(client_id, workout_id)
);

ALTER TABLE coach_program_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manage_assignments" ON coach_program_assignments
  FOR ALL USING (coach_id = auth.uid());

CREATE POLICY "client_view_assignments" ON coach_program_assignments
  FOR SELECT USING (client_id = auth.uid());

-- ============================================================
-- 8. RLS-policyt: Valmentaja pääsee lukemaan asiakkaidensa dataa
-- HUOM: Nämä LISÄTÄÄN olemassaolevien policyjen RINNALLE (permissive OR)
-- ============================================================

-- workout_sessions: valmentaja näkee asiakkaidensa sessiot
CREATE POLICY "coach_view_client_sessions" ON workout_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid()
        AND client_id = workout_sessions.user_id
        AND status = 'active'
    )
  );

-- workouts: valmentaja näkee ja muokkaa asiakkaidensa treenipohjia
CREATE POLICY "coach_view_client_workouts" ON workouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid()
        AND client_id = workouts.user_id
        AND status = 'active'
    )
  );

CREATE POLICY "coach_manage_client_workouts" ON workouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid()
        AND client_id = workouts.user_id
        AND status = 'active'
    )
  );

-- exercises: valmentaja näkee asiakkaidensa liikkeet
CREATE POLICY "coach_view_client_exercises" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workouts w
      JOIN coach_clients cc ON cc.client_id = w.user_id
      WHERE w.id = exercises.workout_id
        AND cc.coach_id = auth.uid()
        AND cc.status = 'active'
    )
  );

-- exercise_sets: valmentaja näkee sarjamäärittelyt
CREATE POLICY "coach_view_client_exercise_sets" ON exercise_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exercises e
      JOIN workouts w ON w.id = e.workout_id
      JOIN coach_clients cc ON cc.client_id = w.user_id
      WHERE e.id = exercise_sets.exercise_id
        AND cc.coach_id = auth.uid()
        AND cc.status = 'active'
    )
  );

-- session_exercises: valmentaja näkee liikkeet sessioissa
CREATE POLICY "coach_view_client_session_exercises" ON session_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_sessions ws
      JOIN coach_clients cc ON cc.client_id = ws.user_id
      WHERE ws.id = session_exercises.session_id
        AND cc.coach_id = auth.uid()
        AND cc.status = 'active'
    )
  );

-- session_sets: valmentaja näkee sarjat
CREATE POLICY "coach_view_client_session_sets" ON session_sets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM session_exercises se
      JOIN workout_sessions ws ON ws.id = se.session_id
      JOIN coach_clients cc ON cc.client_id = ws.user_id
      WHERE se.id = session_sets.session_exercise_id
        AND cc.coach_id = auth.uid()
        AND cc.status = 'active'
    )
  );

-- user_profiles: valmentaja näkee asiakkaidensa profiilit
CREATE POLICY "coach_view_client_profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid()
        AND client_id = user_profiles.id
        AND status = 'active'
    )
  );

-- scheduled_workouts: valmentaja näkee ja hallitsee
CREATE POLICY "coach_view_client_schedules" ON scheduled_workouts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid()
        AND client_id = scheduled_workouts.user_id
        AND status = 'active'
    )
  );

-- goals: valmentaja näkee asiakkaidensa tavoitteet
CREATE POLICY "coach_view_client_goals" ON goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_id = auth.uid()
        AND client_id = goals.user_id
        AND status = 'active'
    )
  );
