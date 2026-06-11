import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServerUser } from '@/lib/supabase/auth';
import WorkoutPlanner from '@/components/workout/WorkoutPlanner';
import { fetchCoachClientOptions } from '@/lib/coach/clients';

export default async function NewProgramPage() {
  const user = await getServerUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const clients = await fetchCoachClientOptions(supabase, user.id);

  return (
    <WorkoutPlanner
      mode="template"
      coachId={user.id}
      clients={clients}
      returnPath="/programs"
      title="Luo uusi treeni"
    />
  );
}
