import { createServerSupabaseClient } from '@/lib/supabase/server';
import WorkoutPlanner from '@/components/workout/WorkoutPlanner';
import { fetchClientSessionSummaries } from '@/lib/sessions/queries';

export default async function NewClientProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const sessionSummaries = await fetchClientSessionSummaries(supabase, clientId, user.id);

  return (
    <WorkoutPlanner
      mode="client"
      targetUserId={clientId}
      coachId={user.id}
      clientId={clientId}
      sessionSummaries={sessionSummaries}
      returnPath={`/clients/${clientId}/programs`}
      title="Luo treeni asiakkaalle"
    />
  );
}
