import { createServerSupabaseClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Dumbbell, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default async function ProgramsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Hae valmentajan tekemät ohjelmat
  const { data: programs } = await supabase
    .from('workouts')
    .select(`
      id,
      program,
      workout_type,
      duration,
      cycle_weeks,
      created_at,
      exercises ( count )
    `)
    .eq('user_id', user.id)
    .eq('managed_by_coach', false)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Treeniohjelmat</h1>
          <p className="text-muted-foreground">Hallitse treenipohjia ja ohjelmoi urheilijoille.</p>
        </div>
        <Button render={<Link href="/programs/new" />} nativeButton={false} className="bg-primary text-primary-foreground font-semibold shadow-[0_0_8px_rgba(0,255,65,0.3)]">
            <Plus className="mr-2 h-4 w-4" />
            Uusi ohjelma
        </Button>
      </div>

      {!programs || programs.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
              <Dumbbell className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-lg font-medium mb-1">Kirjasto on tyhjä</h3>
            <p className="text-muted-foreground mb-4">
              Et ole vielä luonut yhtään treeniohjelmaa. Aloita luomalla ensimmäinen treenipohja.
            </p>
            <Button render={<Link href="/programs/new" />} nativeButton={false} variant="outline" className="border-accent text-accent hover:bg-accent/10">
                <Plus className="mr-2 h-4 w-4" />
                Luo ensimmäinen ohjelma
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((prog) => (
            <Card key={prog.id} className="bg-card border-border hover:border-accent/50 transition-colors flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl truncate pr-2">{prog.program}</CardTitle>
                  <Badge variant="outline" className="uppercase text-[10px] tracking-wider shrink-0">
                    {prog.workout_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2 flex-1 space-y-4">
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{prog.cycle_weeks} viikkoa</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{Math.floor((prog.duration || 0) / 60)} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dumbbell className="h-4 w-4" />
                    <span>{prog.exercises?.[0]?.count || 0} liikettä</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground bg-muted/10">
                <span>Luotu {format(new Date(prog.created_at), 'd.M.yyyy')}</span>
                <Button variant="ghost" size="sm" render={<Link href={`/programs/${prog.id}/edit`} />} nativeButton={false} className="h-8">
                    Muokkaa
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
