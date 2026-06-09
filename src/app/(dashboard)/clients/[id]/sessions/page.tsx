import { createServerSupabaseClient } from '@/lib/supabase/server';
import SessionHistoryList from '@/components/sessions/SessionHistoryList';
import { fetchClientSessionSummaries } from '@/lib/sessions/queries';

export default async function ClientSessionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.id;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const formattedSessions = await fetchClientSessionSummaries(
    supabase,
    clientId,
    user?.id ?? null,
  );

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
