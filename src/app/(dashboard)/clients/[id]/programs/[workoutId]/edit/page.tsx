import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import WorkoutPlanner from '@/components/workout/WorkoutPlanner';
import { fetchClientSessionSummaries } from '@/lib/sessions/queries';
import { fetchWorkoutHistory } from '@/lib/sessions/workout-history';

export default async function EditClientProgramPage({
  params,
}: {
  params: Promise<{ id: string; workoutId: string }>;
}) {
  const { id: clientId, workoutId } = await params;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [sessionSummaries, workoutHistory] = await Promise.all([
    fetchClientSessionSummaries(supabase, clientId, user.id),
    fetchWorkoutHistory(supabase, user.id, clientId, workoutId),
  ]);

  if (!workoutHistory) {
    notFound();
  }

  return (
    <WorkoutPlanner
      mode="client"
      workoutId={workoutId}
      targetUserId={clientId}
      coachId={user.id}
      clientId={clientId}
      sessionSummaries={sessionSummaries}
      workoutHistory={workoutHistory}
      returnPath={`/clients/${clientId}/programs`}
      title="Muokkaa asiakkaan treeniä"
    />
  );
}
