import { notFound } from 'next/navigation';
import { subWeeks } from 'date-fns';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import ClientProfileHeader from '@/components/clients/ClientProfileHeader';
import {
  resolveActiveProgramMeta,
  resolveCycleStatus,
} from '@/lib/programs/cycle-status';
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
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const eightWeeksAgo = subWeeks(new Date(), 8);

  const [
    { data: clientData, error },
    { data: userProfile },
    { data: sessions },
    { data: assignment },
    { data: managedWorkout },
  ] = await Promise.all([
    supabase
      .from('coach_clients')
      .select('id, coach_id, client_id, status, invited_at, accepted_at, notes')
      .eq('coach_id', user.id)
      .eq('client_id', clientId)
      .single(),
    supabase
      .from('user_profiles')
      .select('nickname, age, weight, height, experience_level')
      .eq('id', clientId)
      .maybeSingle(),
    supabase
      .from('workout_sessions')
      .select(`
        cycle_week,
        workout_id,
        date,
        workouts ( program, cycle_weeks, programmed_deloads )
      `)
      .eq('user_id', clientId)
      .gte('date', eightWeeksAgo.toISOString())
      .order('date', { ascending: false })
      .limit(50),
    supabase
      .from('coach_program_assignments')
      .select(`
        workouts ( program, cycle_weeks, programmed_deloads )
      `)
      .eq('client_id', clientId)
      .eq('coach_id', user.id)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('workouts')
      .select('program, cycle_weeks, programmed_deloads')
      .eq('user_id', clientId)
      .eq('managed_by_coach', true)
      .order('created_at', { ascending: false })
      .limit(1)
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
    profile: userProfile ? {
      nickname: userProfile.nickname,
      age: userProfile.age,
      weight: userProfile.weight,
      height: userProfile.height,
      experience_level: userProfile.experience_level,
    } : undefined
  };

  const sessionRows = sessions ?? [];
  const assignedWorkout = assignment?.workouts as {
    program: string | null;
    cycle_weeks: number | null;
    programmed_deloads: number[] | null;
  } | null;

  const programMeta = resolveActiveProgramMeta(
    assignedWorkout,
    managedWorkout,
    sessionRows[0]?.workouts as {
      program: string | null;
      cycle_weeks: number | null;
      programmed_deloads: number[] | null;
    } | null,
  );

  const cycleStatus = resolveCycleStatus(
    sessionRows.map((session) => ({
      date: session.date,
      cycle_week: session.cycle_week,
      workout_id: session.workout_id,
    })),
    programMeta,
  );

  return (
    <div className="flex flex-col h-full">
      <ClientProfileHeader client={client} cycleStatus={cycleStatus} />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
