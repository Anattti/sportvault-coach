type SupabaseClient = Awaited<
  ReturnType<typeof import('@/lib/supabase/server').createServerSupabaseClient>
>;

export interface CoachClientOption {
  id: string;
  name: string;
}

export async function fetchCoachClientOptions(
  supabase: SupabaseClient,
  coachId: string,
): Promise<CoachClientOption[]> {
  const { data: clients } = await supabase
    .from('coach_clients')
    .select('client_id')
    .eq('coach_id', coachId)
    .in('status', ['active', 'paused']);

  const clientIds = (clients ?? []).map((c) => c.client_id);
  if (clientIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, nickname')
    .in('id', clientIds);

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p.nickname]));

  return clientIds
    .map((id) => ({
      id,
      name: profileById.get(id)?.trim() || 'Nimetön asiakas',
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fi'));
}
