import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { Database } from '@/types/supabase';
import { assertSupabaseEnv } from '@/lib/supabase/env';

export const createServerSupabaseClient = cache(async () => {
  const cookieStore = await cookies();
  const { url, anonKey } = assertSupabaseEnv();

  return createServerClient<Database>(
    url,
    anonKey,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options));
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
});
