import { cookies } from 'next/headers';
import { subDays } from 'date-fns';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/supabase/auth';
import { WorkoutNotification } from '@/types';
import { fetchAthleteNoteSessionIds, fetchNotedSessionIds } from '@/lib/sessions/format';

export const LAST_SEEN_COOKIE = 'sv_coach_last_seen';

export async function getLastSeenAt(): Promise<Date> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LAST_SEEN_COOKIE)?.value;

  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return subDays(new Date(), 1);
}

export async function getWorkoutNotifications(): Promise<WorkoutNotification[]> {
  const user = await getServerUser();

  if (!user) return [];

  const supabase = await createServerSupabaseClient();
  const lastSeenAt = await getLastSeenAt();

  const { data: clients } = await supabase
    .from('coach_clients')
    .select('client_id')
    .eq('coach_id', user.id)
    .eq('status', 'active');

  const clientIds = (clients ?? []).map((c) => c.client_id);
  if (clientIds.length === 0) return [];

  const profilesById = new Map<string, string>();
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, nickname')
    .in('id', clientIds);

  for (const p of profiles ?? []) {
    profilesById.set(p.id, p.nickname ?? 'Nimetön urheilija');
  }

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      user_id,
      date,
      created_at,
      total_volume,
      workouts ( program )
    `)
    .in('user_id', clientIds)
    .gt('created_at', lastSeenAt.toISOString())
    .order('created_at', { ascending: false })
    .limit(20);

  const sessionList = (sessions ?? []).filter((s) => s.user_id);
  const sessionIds = sessionList.map((s) => s.id);
  const [athleteNoteSessionIds, coachNoteSessionIds] = await Promise.all([
    fetchAthleteNoteSessionIds(supabase, sessionIds),
    fetchNotedSessionIds(supabase, user.id, sessionIds),
  ]);

  return sessionList.map((s) => ({
    id: s.id,
    clientId: s.user_id!,
    clientNickname: profilesById.get(s.user_id!) ?? 'Nimetön urheilija',
    workoutName: (s.workouts as { program: string | null } | null)?.program ?? null,
    date: s.date ?? s.created_at ?? new Date().toISOString(),
    totalVolume: s.total_volume ?? 0,
    createdAt: s.created_at ?? new Date().toISOString(),
    hasAthleteNote: athleteNoteSessionIds.has(s.id),
    hasCoachNote: coachNoteSessionIds.has(s.id),
  }));
}
