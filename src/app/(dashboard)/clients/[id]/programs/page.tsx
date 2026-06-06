import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AssignProgramDialog from '@/components/programs/AssignProgramDialog';
import ClientProgramCard from '@/components/programs/ClientProgramCard';
import { ClipboardList, Plus } from 'lucide-react';
import {
  buildUpdaterNicknameMap,
  collectWorkoutEditorIds,
} from '@/lib/workouts/update-meta';

export default async function ClientProgramsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const clientId = resolvedParams.id;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: clientPrograms } = await supabase
    .from('workouts')
    .select(`
      id,
      program,
      workout_type,
      duration,
      cycle_weeks,
      managed_by_coach,
      created_at,
      updated_at,
      updated_by,
      user_id,
      exercises ( count )
    `)
    .eq('user_id', clientId)
    .order('created_at', { ascending: false });

  const programRows = clientPrograms ?? [];
  const editorIds = collectWorkoutEditorIds(programRows);
  const { data: editorProfiles } = editorIds.length
    ? await supabase.from('user_profiles').select('id, nickname').in('id', editorIds)
    : { data: [] };
  const updaterNicknames = buildUpdaterNicknameMap(editorProfiles);

  const { data: coachTemplates } = await supabase
    .from('workouts')
    .select('id, program, workout_type, cycle_weeks')
    .eq('user_id', user.id)
    .eq('managed_by_coach', false)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Treeniohjelmat</h2>
          <p className="text-muted-foreground">Urheilijan aktiiviset ja menneet ohjelmat.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            className="font-semibold shadow-neon-sm"
            render={<Link href={`/clients/${clientId}/programs/new`} />}
            nativeButton={false}
          >
            <Plus className="mr-2 h-4 w-4" />
            Luo uusi treeni
          </Button>
          <AssignProgramDialog
            clientId={clientId}
            coachId={user.id}
            coachTemplates={coachTemplates || []}
          />
        </div>
      </div>

      {programRows.length === 0 ? (
        <Card className="glass-panel border-white/8">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25 shadow-neon-sm">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Ei ohjelmia vielä</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Luo uusi treeni tai anna valmiista pohjasta urheilijalle ensimmäinen ohjelma.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                className="font-semibold shadow-neon-sm"
                render={<Link href={`/clients/${clientId}/programs/new`} />}
                nativeButton={false}
              >
                <Plus className="mr-2 h-4 w-4" />
                Luo ensimmäinen treeni
              </Button>
              <AssignProgramDialog
                clientId={clientId}
                coachId={user.id}
                coachTemplates={coachTemplates || []}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {programRows.map((prog) => (
            <ClientProgramCard
              key={prog.id}
              id={prog.id}
              clientId={clientId}
              program={prog.program}
              workoutType={prog.workout_type}
              duration={prog.duration}
              cycleWeeks={prog.cycle_weeks}
              exerciseCount={prog.exercises?.[0]?.count ?? 0}
              managedByCoach={prog.managed_by_coach ?? false}
              updatedAt={prog.updated_at ?? prog.created_at}
              updatedBy={prog.updated_by}
              ownerId={prog.user_id}
              updaterNickname={updaterNicknames[prog.updated_by ?? prog.user_id]}
              viewerId={user.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
