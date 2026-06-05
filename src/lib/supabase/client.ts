import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';
import { assertSupabaseEnv } from '@/lib/supabase/env';

export function createClient() {
  const { url, anonKey } = assertSupabaseEnv();
  return createBrowserClient<Database>(url, anonKey);
}
