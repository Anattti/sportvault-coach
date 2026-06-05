'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ExerciseData, SetBlock, TargetType } from '@/lib/types/workout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save, Loader2 } from 'lucide-react';
import CreateWorkoutSidebar from '@/components/workout/CreateWorkoutSidebar';
import ExerciseList from '@/components/workout/ExerciseList';
import { useToast } from '@/components/ui/toast';

export interface WorkoutBuilderProps {
  mode: 'template' | 'client';
  workoutId?: string;
  targetUserId?: string;
  returnPath: string;
  title: string;
  coachId?: string;
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export default function WorkoutBuilder({
  mode,
  workoutId,
  targetUserId,
  returnPath,
  title,
  coachId,
}: WorkoutBuilderProps) {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const [programName, setProgramName] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [notes, setNotes] = useState('');
  const [deloadCycle, setDeloadCycle] = useState<number>(4);
  const [cycleWeeks, setCycleWeeks] = useState<number>(1);
  const [activeCycleWeek, setActiveCycleWeek] = useState<number>(1);
  const [programmedDeloads, setProgrammedDeloads] = useState<number[]>([]);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!workoutId);

  useEffect(() => {
    if (!workoutId) return;

    const fetchWorkout = async () => {
      try {
        const { data: workout, error } = await supabase
          .from('workouts')
          .select(`
            *,
            exercises (
              *,
              exercise_sets (*)
            )
          `)
          .eq('id', workoutId)
          .single();

        if (error) throw error;
        if (!workout) throw new Error('Ohjelmaa ei löytynyt');

        setProgramName(workout.program || '');
        setWorkoutType(workout.workout_type || '');
        setNotes(workout.notes || '');
        setDeloadCycle(workout.deload_cycle || 4);
        setCycleWeeks(workout.cycle_weeks || 1);
        setProgrammedDeloads(workout.programmed_deloads || []);

        if (workout.exercises && workout.exercises.length > 0) {
          const sortedExercises = [...workout.exercises].sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
          );

          const formattedExercises: ExerciseData[] = sortedExercises.map((ex) => {
            const sets: SetBlock[] = (ex.exercise_sets || []).map((s) => ({
              id: String(s.id || Math.random()),
              reps: s.reps?.toString() || '',
              weight: s.weight?.toString() || '',
              restTime: s.rest_time?.toString() || '60',
              targetRpe: s.rpe?.toString() || '',
              targetType: ((s.target_type as TargetType) || 'reps'),
              isBodyweight: Boolean(s.is_bodyweight),
              cycleWeek: Number(s.cycle_week) || 1,
              notes: ((s as { notes?: string | null }).notes) || '',
            }));

            sets.sort((a, b) => (a.cycleWeek || 1) - (b.cycleWeek || 1));

            return {
              id: String(ex.id || Math.random()),
              name: String(ex.name || ''),
              category: String(ex.category || ''),
              notes: String((ex as { notes?: string | null }).notes || ''),
              setBlocks: sets.length > 0 ? sets : [{
                id: Math.random().toString(),
                reps: '',
                weight: '',
                restTime: '60',
                targetType: 'reps',
                isBodyweight: false,
                cycleWeek: 1,
                notes: '',
              }],
            };
          });

          setExercises(formattedExercises);
        }
      } catch (err) {
        console.error('Error fetching workout:', err);
        toast('Ohjelman haku epäonnistui', 'error');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId, supabase, toast]);

  const updateCycleWeeks = useCallback(
    (newWeeks: number) => {
      setExercises((prev) =>
        prev.map((ex) => {
          const baselineSets = ex.setBlocks.filter((b) => (b.cycleWeek ?? 1) === 1);
          if (baselineSets.length === 0) return ex;

          let updatedSets = [...ex.setBlocks];
          updatedSets = updatedSets.map((s) => (!s.cycleWeek ? { ...s, cycleWeek: 1 } : s));

          for (let w = 2; w <= newWeeks; w++) {
            const weekSetsExist = updatedSets.some((s) => s.cycleWeek === w);
            if (!weekSetsExist) {
              const copiedSets = baselineSets.map((b) => ({
                ...b,
                id: Math.random().toString(),
                cycleWeek: w,
              }));
              updatedSets.push(...copiedSets);
            }
          }

          return {
            ...ex,
            setBlocks: updatedSets.filter((s) => (s.cycleWeek ?? 1) <= newWeeks),
          };
        })
      );

      setCycleWeeks(newWeeks);
      if (activeCycleWeek > newWeeks) {
        setActiveCycleWeek(newWeeks);
      }
    },
    [activeCycleWeek]
  );

  const addManualExercise = useCallback(() => {
    const allSets: SetBlock[] = [];
    for (let w = 1; w <= cycleWeeks; w++) {
      allSets.push({
        id: Math.random().toString(),
        reps: '',
        weight: '',
        restTime: '60',
        targetType: 'reps',
        isBodyweight: false,
        cycleWeek: w,
        notes: '',
      });
    }

    setExercises((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        name: '',
        category: '',
        setBlocks: allSets,
        notes: '',
      },
    ]);
  }, [cycleWeeks]);

  const handleSave = async () => {
    if (!programName.trim() || !workoutType || exercises.length === 0) {
      toast('Täytä ohjelman nimi, tyyppi ja vähintään yksi liike', 'error');
      return;
    }

    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const formattedExercises = exercises.map((ex, index) => ({
        id: isValidUuid(ex.id) ? ex.id : null,
        name: ex.name,
        category: ex.category || null,
        superset_group: null,
        target_rpe: null,
        order_index: index,
        notes: ex.notes || null,
        sets: ex.setBlocks.map((block) => ({
          reps: parseInt(block.reps) || 0,
          weight: block.isBodyweight ? 0 : (parseFloat(block.weight) || 0),
          rest_time: parseInt(block.restTime) || 60,
          rpe: parseFloat(block.targetRpe || '0') || null,
          is_bodyweight: block.isBodyweight,
          target_type: block.targetType,
          cycle_week: block.cycleWeek || 1,
          notes: block.notes || null,
          sets: 1,
        })),
      }));

      if (workoutId) {
        const { data, error } = await supabase.rpc('upsert_workout_details', {
          p_workout_id: workoutId,
          p_program: programName,
          p_workout_type: workoutType,
          p_notes: notes || '',
          p_exercises: formattedExercises,
          p_deload_cycle: deloadCycle,
          p_cycle_weeks: cycleWeeks,
          p_programmed_deloads: programmedDeloads.length > 0 ? programmedDeloads : null,
        });

        if (error) throw error;
        if (data && typeof data === 'object' && 'success' in data && !data.success) {
          throw new Error((data as { error?: string }).error || 'Tallennus epäonnistui');
        }
      } else {
        const ownerId = mode === 'client' ? targetUserId : userData.user.id;
        if (!ownerId) throw new Error('Kohdekäyttäjä puuttuu');

        const { data, error } = await supabase.rpc('insert_workout_with_children', {
          p_user_id: ownerId,
          p_date: new Date().toISOString(),
          p_program: programName,
          p_workout_type: workoutType,
          p_duration: exercises.length * 10 * 60,
          p_feeling: 3,
          p_notes: notes || '',
          p_progression: 'linear',
          p_progression_percentage: '0',
          p_deload_cycle: deloadCycle,
          p_cycle_weeks: cycleWeeks,
          p_programmed_deloads: programmedDeloads.length > 0 ? programmedDeloads : null,
          p_exercises: formattedExercises,
          p_managed_by_coach: mode === 'client',
          p_source_template_id: null,
        });

        if (error) throw error;
        if (data && typeof data === 'object' && 'success' in data && !data.success) {
          throw new Error((data as { error?: string }).error || 'Tallennus epäonnistui');
        }

        if (mode === 'client' && coachId && data && typeof data === 'object' && 'workout_id' in data) {
          const newWorkoutId = (data as { workout_id: string }).workout_id;
          await supabase.from('coach_program_assignments').insert({
            coach_id: coachId,
            client_id: ownerId,
            workout_id: newWorkoutId,
          });
        }
      }

      toast('Treeniohjelma tallennettu', 'success');
      router.push(returnPath);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast('Tallennus epäonnistui', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(returnPath)} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-neon-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Tallenna
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        <div className="lg:col-span-4 lg:sticky lg:top-4">
          <CreateWorkoutSidebar
            programName={programName}
            setProgramName={setProgramName}
            workoutType={workoutType}
            setWorkoutType={setWorkoutType}
            deloadCycle={deloadCycle}
            setDeloadCycle={setDeloadCycle}
            cycleWeeks={cycleWeeks}
            setCycleWeeks={updateCycleWeeks}
            activeCycleWeek={activeCycleWeek}
            setActiveCycleWeek={setActiveCycleWeek}
            programmedDeloads={programmedDeloads}
            setProgrammedDeloads={setProgrammedDeloads}
            notes={notes}
            setNotes={setNotes}
          />
        </div>

        <div className="lg:col-span-8 space-y-4 pb-24">
          <ExerciseList
            exercises={exercises}
            setExercises={setExercises}
            activeCycleWeek={activeCycleWeek}
          />

          <Button
            onClick={addManualExercise}
            variant="outline"
            className="w-full py-8 border-dashed rounded-xl glass-panel-hover"
          >
            + Lisää uusi liike
          </Button>
        </div>
      </div>
    </div>
  );
}
