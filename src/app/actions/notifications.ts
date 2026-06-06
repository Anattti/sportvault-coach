'use server';

import { cookies } from 'next/headers';
import { LAST_SEEN_COOKIE } from '@/lib/dashboard/notifications';

export async function markNotificationsSeen(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(LAST_SEEN_COOKIE, new Date().toISOString(), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });
}
