import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { fetchWorkoutHistory } from '@/lib/sessions/workout-history';
import WorkoutHistoryHero from '@/components/sessions/WorkoutHistoryHero';
import WorkoutHistoryTimeline from '@/components/sessions/WorkoutHistoryTimeline';
import { Button } from '@/components/ui/button';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; workoutId: string }>;
}): Promise<Metadata> {
  const { id: clientId, workoutId } = await params;
  const supabase = await createServerSupabaseClient();

  const [{ data: workout }, { data: profile }] = await Promise.all([
    supabase
      .from('workouts')
      .select('program')
      .eq('id', workoutId)
      .eq('user_id', clientId)
      .maybeSingle(),
    supabase
      .from('user_profiles')
      .select('nickname')
      .eq('id', clientId)
      .maybeSingle(),
  ]);

  const programName = workout?.program ?? 'Treeni';
  const clientName = profile?.nickname ?? 'Asiakas';

  return {
    title: `${programName} – treenihistoria | ${clientName}`,
  };
}

export default async function WorkoutHistoryPage({
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

  const history = await fetchWorkoutHistory(supabase, user.id, clientId, workoutId);

  if (!history) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        size="sm"
        render={<Link href={`/clients/${clientId}/sessions`} />}
        nativeButton={false}
        className="-ml-2 text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Takaisin treenihistoriaan
      </Button>

      <WorkoutHistoryHero meta={history.meta} />
      <WorkoutHistoryTimeline data={history} clientId={clientId} />
    </div>
  );
}
