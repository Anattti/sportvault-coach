import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import SessionDetail from '@/components/sessions/SessionDetail';
import CoachNoteEditor from '@/components/sessions/CoachNoteEditor';
import { SessionDetail as SessionDetailType, WarmupData, CooldownData } from '@/types';
import { calculateE1RM } from '@/lib/analytics';
import { mapToAnalyticsSessions } from '@/lib/client-analytics/progress';
import { format } from 'date-fns';

export default async function SingleSessionPage({ 
  params 
}: { 
  params: Promise<{ id: string; sessionId: string }> 
}) {
  const resolvedParams = await params;
  const { id: clientId, sessionId } = resolvedParams;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Hae sessio
  const { data: sessionData, error: sessionError } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      date,
      duration,
      total_volume,
      feeling,
      rpe_average,
      notes,
      warmup,
      cooldown,
      heart_rate_avg,
      heart_rate_max,
      cycle_week,
      workouts ( program, cycle_weeks )
    `)
    .eq('id', sessionId)
    .eq('user_id', clientId)
    .single();

  if (sessionError || !sessionData) {
    notFound();
  }

  const { data: priorSessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      date,
      session_exercises (
        name,
        session_sets ( weight_used, reps_completed )
      )
    `)
    .eq('user_id', clientId)
    .lt('date', sessionData.date ?? new Date().toISOString())
    .order('date', { ascending: true });

  const priorAnalytics = mapToAnalyticsSessions(
    (priorSessions ?? []).map((s) => ({
      id: s.id,
      user_id: clientId,
      workout_id: null,
      date: s.date,
      duration: null,
      total_volume: null,
      rpe_average: null,
      cycle_week: null,
      is_deload: null,
      session_exercises: (s.session_exercises ?? []).map((ex) => ({
        id: '',
        name: ex.name,
        exercise_id: null,
        is_ad_hoc: null,
        is_swapped: null,
        session_sets: (ex.session_sets ?? []).map((set) => ({
          weight_used: set.weight_used,
          reps_completed: set.reps_completed,
          rpe: null,
        })),
      })),
    })),
  );

  const previousBestByExercise: Record<string, number> = {};
  for (const session of priorAnalytics) {
    for (const exercise of session.exercises) {
      const maxE1RM = Math.max(
        0,
        ...exercise.sets.map((set) =>
          calculateE1RM(set.weight_used, set.reps_completed),
        ),
      );
      if (maxE1RM > 0) {
        previousBestByExercise[exercise.name] = Math.max(
          previousBestByExercise[exercise.name] ?? 0,
          maxE1RM,
        );
      }
    }
  }

  // Hae liikkeet ja sarjat
  const { data: exercisesData } = await supabase
    .from('session_exercises')
    .select(`
      id,
      name,
      order_index,
      notes,
      heart_rate_avg,
      heart_rate_max,
      session_sets (
        set_index,
        weight_used,
        reps_completed,
        rpe,
        rest_time_taken,
        notes,
        completed_at
      )
    `)
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true });

  // Hae valmentajan muistiinpano
  const { data: noteData } = await supabase
    .from('coach_session_notes')
    .select('content')
    .eq('session_id', sessionId)
    .eq('coach_id', user.id)
    .single();

  // Muotoile data
  const formattedData: SessionDetailType = {
    session: {
      id: sessionData.id,
      date: sessionData.date || '',
      duration: sessionData.duration || 0,
      totalVolume: sessionData.total_volume || 0,
      feeling: sessionData.feeling,
      rpeAverage: sessionData.rpe_average,
      notes: sessionData.notes,
      warmup: (sessionData.warmup as unknown as WarmupData) ?? null,
      cooldown: (sessionData.cooldown as unknown as CooldownData) ?? null,
      heartRateAvg: sessionData.heart_rate_avg,
      heartRateMax: sessionData.heart_rate_max,
      heartRateSamples: null,
      cycleWeek: sessionData.cycle_week,
      workoutName: sessionData.workouts?.program || null,
      cycleWeeks: sessionData.workouts?.cycle_weeks || null,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exercises: (exercisesData || []).map((ex: any) => ({
      id: ex.id,
      name: ex.name,
      orderIndex: ex.order_index,
      notes: ex.notes,
      heartRateAvg: ex.heart_rate_avg,
      heartRateMax: ex.heart_rate_max,
      coachNote: null, // myöhemmin exercise-tason notet jos tarvitaan
      sets: (ex.session_sets || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => (a.set_index as number) - (b.set_index as number))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((set: any) => ({
          setIndex: set.set_index,
          weightUsed: set.weight_used,
          repsCompleted: set.reps_completed,
          rpe: set.rpe,
          restTimeTaken: set.rest_time_taken,
          notes: set.notes,
          completedAt: set.completed_at,
        }))
    })),
    coachNote: noteData?.content || null,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <Button variant="ghost" size="sm" render={<Link href={`/clients/${clientId}`} />} nativeButton={false} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Takaisin asiakkaan tietoihin
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">
            {formattedData.session.workoutName || 'Treenisessio'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Suoritettu {format(new Date(formattedData.session.date), 'd.M.yyyy')}
            {formattedData.session.cycleWeek && ` • Syklin viikko ${formattedData.session.cycleWeek}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px] items-start">
        <div className="order-2 lg:order-1">
          <SessionDetail data={formattedData} previousBestByExercise={previousBestByExercise} />
        </div>
        <div className="order-1 lg:order-2 lg:sticky lg:top-6">
          <CoachNoteEditor 
            sessionId={sessionId} 
            initialNote={formattedData.coachNote} 
          />
        </div>
      </div>
    </div>
  );
}
