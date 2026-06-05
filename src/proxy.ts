import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export async function proxy(request: NextRequest) {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Päivitetään pyynnön evästeet
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // 2. Luodaan uusi vastaus uudella pyynnöllä
          supabaseResponse = NextResponse.next({
            request,
          });
          // 3. Asetetaan evästeet lähtevään vastaukseen
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser varmistaa istunnon voimassaolon ja päivittää tarvittaessa evästeet (token refresh)
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
    || request.nextUrl.pathname.startsWith('/register');
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback')
    || request.nextUrl.pathname.startsWith('/auth/confirm');
  const isResetPasswordRoute = request.nextUrl.pathname.startsWith('/reset-password');
  const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding');
  const isPublicRoute = isAuthRoute || isAuthCallback;

  // Apufunktio turvalliseen uudelleenohjaukseen (säilyttää päivitetyt evästeet)
  const safeRedirect = (path: string, searchParams?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
    }
    const redirectResponse = NextResponse.redirect(url);
    
    // Kopioidaan supabaseResponsen mahdollisesti asettamat evästeet ohjaukseen
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirectResponse;
  };

  // Ei kirjautunut → ohjaa loginiin (paitsi julkiset reitit)
  if (!user && !isPublicRoute) {
    return safeRedirect('/login');
  }

  // Kirjautunut + auth-sivulla → ohjaa dashboardiin tai onboardingiin
  if (user && isAuthRoute) {
    const { data: coachProfile } = await supabase
      .from('coach_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    return safeRedirect(coachProfile ? '/' : '/onboarding');
  }

  // Tarkista valmentajaprofiili (dashboard-reitit)
  if (user && !isAuthRoute && !isAuthCallback && !isResetPasswordRoute) {
    const { data: coachProfile } = await supabase
      .from('coach_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (!coachProfile && !isOnboardingRoute) {
      return safeRedirect('/onboarding');
    }

    if (coachProfile && isOnboardingRoute) {
      return safeRedirect('/');
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/webhooks).*)'],
};
