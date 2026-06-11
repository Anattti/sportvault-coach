import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/supabase/auth';
import ClientProfileHeader from '@/components/clients/ClientProfileHeader';
import { CoachClient } from '@/types';

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const clientId = resolvedParams.id;
  const user = await getServerUser();

  if (!user) return null;

  const supabase = await createServerSupabaseClient();

  const [{ data: clientData, error }, { data: userProfile }] = await Promise.all([
    supabase
      .from('coach_clients')
      .select('id, coach_id, client_id, status, invited_at, accepted_at, notes')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .single(),
    supabase
      .from('user_profiles')
      .select('nickname, age, weight, height, experience_level, fitness_goals')
      .eq('id', clientId)
      .maybeSingle(),
  ]);

  if (error || !clientData) {
    notFound();
  }

  const client: CoachClient = {
    id: clientData.id,
    coach_id: clientData.coach_id,
    client_id: clientData.client_id,
    status: (clientData.status ?? 'pending') as CoachClient['status'],
    invited_at: clientData.invited_at ?? new Date().toISOString(),
    accepted_at: clientData.accepted_at,
    notes: clientData.notes,
    profile: userProfile
      ? {
          nickname: userProfile.nickname,
          age: userProfile.age,
          weight: userProfile.weight,
          height: userProfile.height,
          experience_level: userProfile.experience_level,
          fitness_goals: userProfile.fitness_goals,
        }
      : undefined,
  };

  return (
    <div className="flex flex-col h-full">
      <ClientProfileHeader client={client} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
