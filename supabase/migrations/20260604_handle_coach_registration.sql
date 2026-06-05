-- ============================================================
-- Trigger: handle_new_coach_registration
-- 
-- Tämä trigger laukeaa automaattisesti kun uusi käyttäjä luodaan
-- auth.users-tauluun. Se lukee rekisteröinnin yhteydessä annetun
-- raw_user_meta_data -kentän ja luo profiilit oikealla roolilla.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_coach_registration()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_business_name TEXT;
BEGIN
  -- Haetaan rooli ja yritysnimi metadatasta (signUp options.data)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'athlete');
  user_business_name := NEW.raw_user_meta_data->>'business_name';

  -- Luodaan user_profiles -rivi oikealla roolilla
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, user_role)
  ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;

  -- Jos rooli on coach, luodaan myös coach_profiles -rivi
  IF user_role = 'coach' THEN
    INSERT INTO public.coach_profiles (id, business_name)
    VALUES (NEW.id, user_business_name)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Poistetaan vanha trigger jos on olemassa
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Luodaan trigger joka laukeaa uuden käyttäjän luonnin yhteydessä
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_coach_registration();
