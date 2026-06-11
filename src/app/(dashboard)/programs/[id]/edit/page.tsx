import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/supabase/auth';
import WorkoutPlanner from '@/components/workout/WorkoutPlanner';
import { fetchCoachClientOptions } from '@/lib/coach/clients';

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getServerUser();
  if (!user) return null;

  const { id: workoutId } = await params;
  const supabase = await createServerSupabaseClient();
  const clients = await fetchCoachClientOptions(supabase, user.id);

  return (
    <WorkoutPlanner
      mode="template"
      coachId={user.id}
      workoutId={workoutId}
      clients={clients}
      returnPath="/programs"
      title="Muokkaa treeniä"
    />
  );
}
