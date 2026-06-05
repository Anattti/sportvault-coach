'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/toast';

interface AssignProgramDialogProps {
  clientId: string;
  coachId: string;
  coachTemplates: { id: string; program: string; cycle_weeks: number; [key: string]: unknown }[];
}

export default function AssignProgramDialog({ clientId, coachId, coachTemplates }: AssignProgramDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const handleAssign = async () => {
    if (!selectedTemplateId) return;
    setIsLoading(true);

    try {
      const { data: template, error: fetchError } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises (
            name,
            category,
            superset_group,
            target_rpe,
            order_index,
            exercise_sets (
              weight,
              reps,
              sets,
              rest_time,
              rpe,
              is_bodyweight,
              target_type,
              cycle_week
            )
          )
        `)
        .eq('id', selectedTemplateId)
        .single();

      if (fetchError || !template) throw new Error('Templatea ei löytynyt');

      const formattedExercises = template.exercises.map((ex) => ({
        name: ex.name,
        category: ex.category,
        superset_group: ex.superset_group,
        target_rpe: ex.target_rpe,
        order_index: ex.order_index,
        notes: null,
        sets: ex.exercise_sets.map((set) => ({
          weight: set.weight,
          reps: set.reps,
          sets: set.sets,
          rest_time: set.rest_time,
          rpe: set.rpe,
          is_bodyweight: set.is_bodyweight,
          target_type: set.target_type,
          cycle_week: set.cycle_week,
          notes: null,
        })),
      }));

      const payload = {
        p_user_id: clientId,
        p_date: new Date().toISOString(),
        p_program: template.program,
        p_workout_type: template.workout_type,
        p_duration: template.duration,
        p_feeling: template.feeling,
        p_notes: template.notes ?? '',
        p_progression: template.progression ?? '',
        p_progression_percentage: template.progression_percentage ?? '',
        p_deload_cycle: template.deload_cycle,
        p_cycle_weeks: template.cycle_weeks,
        p_programmed_deloads: template.programmed_deloads,
        p_exercises: formattedExercises,
        p_managed_by_coach: true,
        p_source_template_id: selectedTemplateId,
      };

      const { data: insertResult, error: insertError } = await supabase.rpc(
        'insert_workout_with_children',
        payload
      );

      if (insertError) throw insertError;

      const result = insertResult as { success?: boolean; workout_id?: string; error?: string } | null;
      if (!result?.success || !result.workout_id) {
        throw new Error(result?.error || 'Kopiointi epäonnistui');
      }

      await supabase.from('coach_program_assignments').insert({
        coach_id: coachId,
        client_id: clientId,
        workout_id: result.workout_id,
      });

      toast('Ohjelma kopioitu urheilijalle', 'success');
      setOpen(false);
      setSelectedTemplateId('');
      router.refresh();
    } catch (error) {
      console.error('Error assigning program:', error);
      toast('Ohjelman antaminen epäonnistui', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="font-semibold" />}>
        <Plus className="mr-2 h-4 w-4" />
        Anna ohjelma
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle>Anna ohjelma urheilijalle</DialogTitle>
          <DialogDescription>
            Valitse kirjastostasi ohjelmapohja. Se kopioidaan urheilijan omaan puhelimeen näkyviin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Valitse ohjelma kirjastosta</Label>
            <Select value={selectedTemplateId} onValueChange={(val) => setSelectedTemplateId(val || '')}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Valitse treeniohjelma..." />
              </SelectTrigger>
              <SelectContent>
                {coachTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.program} ({t.cycle_weeks} viikkoa)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleAssign} className="w-full font-bold" disabled={isLoading || !selectedTemplateId}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kopioi urheilijalle
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
