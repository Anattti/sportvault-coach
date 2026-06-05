import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AssignProgramDialog from '@/components/programs/AssignProgramDialog';
import DeleteClientProgramButton from '@/components/programs/DeleteClientProgramButton';
import { Pencil, Plus } from 'lucide-react';

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
      exercises ( count )
    `)
    .eq('user_id', clientId)
    .order('created_at', { ascending: false });

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
          <Button variant="default" className="font-semibold" render={<Link href={`/clients/${clientId}/programs/new`} />} nativeButton={false}>
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

      {!clientPrograms || clientPrograms.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <p>Urheilijalla ei ole vielä yhtään ohjelmaa.</p>
            <Button className="mt-4" render={<Link href={`/clients/${clientId}/programs/new`} />} nativeButton={false}>
              Luo ensimmäinen treeni
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clientPrograms.map((prog) => (
            <Card key={prog.id} className="bg-card border-border flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl truncate pr-2">{prog.program}</CardTitle>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className="uppercase text-[10px] tracking-wider border-accent text-accent">
                      {prog.workout_type}
                    </Badge>
                    {prog.managed_by_coach && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
                        Valmentajan
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4 flex-1">
                <p className="text-sm text-muted-foreground">
                  Sykliviikot: {prog.cycle_weeks}
                </p>
              </CardContent>
              <CardFooter className="flex gap-2 pt-0">
                <Button variant="outline" size="sm" className="flex-1" render={<Link href={`/clients/${clientId}/programs/${prog.id}/edit`} />} nativeButton={false}>
                  <Pencil className="mr-2 h-3 w-3" />
                  Muokkaa
                </Button>
                <DeleteClientProgramButton workoutId={prog.id} clientId={clientId} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
