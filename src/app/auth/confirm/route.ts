import { createServerClient } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { assertSupabaseEnv } from '@/lib/supabase/env';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const defaultNext = type === 'recovery' ? '/reset-password' : '/';
  const next = searchParams.get('next') ?? defaultNext;
  const safeNext = next.startsWith('/') ? next : defaultNext;

  let supabaseConfig: { url: string; anonKey: string };
  try {
    supabaseConfig = assertSupabaseEnv();
  } catch {
    return NextResponse.redirect(`${origin}/login?error=missing_supabase_env`);
  }

  if (tokenHash && type) {
    const supabaseResponse = NextResponse.redirect(`${origin}${safeNext}`);

    const supabase = createServerClient(
      supabaseConfig.url,
      supabaseConfig.anonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (!error) {
      return supabaseResponse;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_confirm_error`);
}
