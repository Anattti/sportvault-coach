import { createServerSupabaseClient } from '@/lib/supabase/server';
import SessionHistoryList from '@/components/sessions/SessionHistoryList';
import { fetchNotedSessionIds, formatSessionSummaries } from '@/lib/sessions/format';

export default async function ClientSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.id;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: sessions } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      date,
      duration,
      total_volume,
      feeling,
      rpe_average,
      heart_rate_avg,
      heart_rate_max,
      cycle_week,
      workout_id,
      workouts ( program, workout_type, cycle_weeks ),
      session_exercises ( id )
    `)
    .eq('user_id', clientId)
    .order('date', { ascending: false });

  const sessionRows = sessions ?? [];
  const sessionIds = sessionRows.map((s) => s.id);
  const notedSessionIds = user
    ? await fetchNotedSessionIds(supabase, user.id, sessionIds)
    : new Set<string>();

  const formattedSessions = formatSessionSummaries(sessionRows, notedSessionIds);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Treenihistoria</h2>
          <p className="text-muted-foreground">Kaikki urheilijan suorittamat treenit.</p>
        </div>
      </div>

      <SessionHistoryList sessions={formattedSessions} clientId={clientId} />
    </div>
  );
}
