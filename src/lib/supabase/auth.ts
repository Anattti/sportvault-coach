import { cache } from 'react';
import type { User } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const getServerUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCoachProfileId = cache(async (): Promise<string | null> => {
  const user = await getServerUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { data: coachProfile } = await supabase
    .from('coach_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  return coachProfile?.id ?? null;
});
