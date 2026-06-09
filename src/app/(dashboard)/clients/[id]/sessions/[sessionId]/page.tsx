import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, History } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import SessionDetail from '@/components/sessions/SessionDetail';
import CoachNoteEditor from '@/components/sessions/CoachNoteEditor';
import { fetchSessionDetail } from '@/lib/sessions/queries';
import { formatCycleWeekLabel } from '@/lib/sessions/format';
import { formatSessionDateTimeFi } from '@/lib/dates/fi';

export default async function SingleSessionPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const resolvedParams = await params;
  const { id: clientId, sessionId } = resolvedParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const result = await fetchSessionDetail(supabase, sessionId, clientId, user.id);

  if (!result) {
    notFound();
  }

  const { data: formattedData, previousBestByExercise } = result;

  const { data: sessionMeta } = await supabase
    .from('workout_sessions')
    .select('workout_id')
    .eq('id', sessionId)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link href={`/clients/${clientId}/sessions`} />}
            nativeButton={false}
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Takaisin treenihistoriaan
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                {formattedData.session.workoutName || 'Treenisessio'}
              </h2>
              <p className="text-sm text-muted-foreground">
                Suoritettu {formatSessionDateTimeFi(new Date(formattedData.session.date))}
                {formatCycleWeekLabel(
                  formattedData.session.cycleWeek,
                  formattedData.session.cycleWeeks,
                ) &&
                  ` • Viikko ${formatCycleWeekLabel(
                    formattedData.session.cycleWeek,
                    formattedData.session.cycleWeeks,
                  )}`}
              </p>
            </div>
            {sessionMeta?.workout_id && (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 border-white/10 bg-white/[0.03] text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                render={
                  <Link href={`/clients/${clientId}/sessions/workout/${sessionMeta.workout_id}`} />
                }
                nativeButton={false}
              >
                <History className="mr-1.5 h-3.5 w-3.5" />
                Kaikki suoritukset
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        <div className="order-2 lg:order-1">
          <SessionDetail data={formattedData} previousBestByExercise={previousBestByExercise} />
        </div>
        <div className="order-1 lg:order-2 lg:sticky lg:top-6">
          <CoachNoteEditor sessionId={sessionId} initialNote={formattedData.coachNote} />
        </div>
      </div>
    </div>
  );
}
