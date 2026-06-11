import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/supabase/auth';
import ClientList from '@/components/clients/ClientList';
import InviteClientDialog from '@/components/clients/InviteClientDialog';
import PendingInvitations from '@/components/clients/PendingInvitations';
import { CoachClient } from '@/types';

export default async function ClientsPage() {
  const user = await getServerUser();

  if (!user) return null;

  const supabase = await createServerSupabaseClient();

  const { data: clients } = await supabase
    .from('coach_clients')
    .select('id, coach_id, client_id, status, invited_at, accepted_at, notes')
    .eq('coach_id', user.id);

  const clientIds = (clients || []).map((c) => c.client_id);
  const profilesById = new Map<string, {
    nickname: string | null;
    age: number | null;
    weight: number | null;
    height: number | null;
    experience_level: string | null;
  }>();

  const [{ data: profiles }, { data: pendingInvitations }] = await Promise.all([
    clientIds.length > 0
      ? supabase
          .from('user_profiles')
          .select('id, nickname, age, weight, height, experience_level')
          .in('id', clientIds)
      : Promise.resolve({ data: [] as Array<{
          id: string;
          nickname: string | null;
          age: number | null;
          weight: number | null;
          height: number | null;
          experience_level: string | null;
        }> }),
    supabase
      .from('coach_invitations')
      .select('id, invite_code, client_email, expires_at, created_at')
      .eq('coach_id', user.id)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ]);

  for (const p of profiles || []) {
    profilesById.set(p.id, p);
  }

  const formattedClients: CoachClient[] = (clients || []).map((c) => {
    const profile = profilesById.get(c.client_id);
    return {
      id: c.id,
      coach_id: c.coach_id,
      client_id: c.client_id,
      status: (c.status ?? 'pending') as CoachClient['status'],
      invited_at: c.invited_at ?? new Date().toISOString(),
      accepted_at: c.accepted_at,
      notes: c.notes,
      profile: profile ? {
        nickname: profile.nickname,
        age: profile.age,
        weight: profile.weight,
        height: profile.height,
        experience_level: profile.experience_level,
      } : undefined,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asiakkaat</h1>
          <p className="text-muted-foreground">Hallitse urheilijoita ja kutsu uusia valmennettavia.</p>
        </div>
        <InviteClientDialog coachId={user.id} />
      </div>

      <PendingInvitations invitations={pendingInvitations || []} />

      <ClientList clients={formattedClients} />
    </div>
  );
}
