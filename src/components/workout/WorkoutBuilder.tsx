'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ApplyExerciseFromHistoryPayload,
  ApplyWorkoutFromHistoryPayload,
  ExerciseData,
  ExerciseNameSuggestion,
  SetBlock,
  TargetType,
  WeekViewMode,
} from '@/lib/types/workout';
import { fetchClientExerciseOptions } from '@/lib/sessions/exercise-history';
import {
  fetchCoachExerciseNameOptions,
  fetchLatestPlannedSets,
} from '@/lib/workouts/exercise-suggestions';
import { buildSetBlocksForExercise } from '@/lib/workouts/set-blocks';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Save, Loader2, Plus } from 'lucide-react';
import ProgramSettingsStrip from '@/components/workout/ProgramSettingsStrip';
import WeekNavigator from '@/components/workout/WeekNavigator';
import ExerciseList from '@/components/workout/ExerciseList';
import { useToast } from '@/components/ui/toast';

export interface WorkoutBuilderProps {
  mode: 'template' | 'client';
  workoutId?: string;
  targetUserId?: string;
  returnPath: string;
  title: string;
  coachId?: string;
  completedWeekCounts?: Record<number, number>;
  variant?: 'standalone' | 'content-only';
  hideMobileActionBar?: boolean;
  onLoadingChange?: (loading: boolean) => void;
  onExercisesChange?: (exercises: ExerciseData[]) => void;
}

export interface WorkoutBuilderHandle {
  save: () => void;
  addExercise: () => void;
  applyExerciseFromHistory: (payload: ApplyExerciseFromHistoryPayload) => void;
  applyWorkoutFromHistory: (payload: ApplyWorkoutFromHistoryPayload) => void;
  getExerciseNames: () => string[];
}

function isValidUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

const WorkoutBuilder = forwardRef<WorkoutBuilderHandle, WorkoutBuilderProps>(
  function WorkoutBuilder(
    {
      mode,
      workoutId,
      targetUserId,
      returnPath,
      title,
      coachId,
      completedWeekCounts,
      variant = 'standalone',
      hideMobileActionBar = false,
      onLoadingChange,
      onExercisesChange,
    },
    ref,
  ) {
    const router = useRouter();
    const supabase = createClient();
    const { toast } = useToast();
    const isContentOnly = variant === 'content-only';

    const [programName, setProgramName] = useState('');
    const [workoutType, setWorkoutType] = useState('');
    const [notes, setNotes] = useState('');
    const [deloadCycle, setDeloadCycle] = useState<number>(4);
    const [cycleWeeks, setCycleWeeks] = useState<number>(1);
    const [activeCycleWeek, setActiveCycleWeek] = useState<number>(1);
    const [programmedDeloads, setProgrammedDeloads] = useState<number[]>([]);
    const [exercises, setExercises] = useState<ExerciseData[]>([]);
    const [weekViewMode, setWeekViewMode] = useState<WeekViewMode>('focused');
    const [syncSetsAcrossWeeks, setSyncSetsAcrossWeeks] = useState(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(!!workoutId);
    const [exerciseSuggestions, setExerciseSuggestions] = useState<ExerciseNameSuggestion[]>([]);

    useEffect(() => {
      onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

    const onExercisesChangeRef = useRef(onExercisesChange);
    onExercisesChangeRef.current = onExercisesChange;

    useEffect(() => {
      onExercisesChangeRef.current?.(exercises);
    }, [exercises]);

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
              (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
            );

            const formattedExercises: ExerciseData[] = sortedExercises.map((ex) => {
              const sets: SetBlock[] = (ex.exercise_sets || []).map((s) => ({
                id: String(s.id || Math.random()),
                reps: s.reps?.toString() || '',
                weight: s.weight?.toString() || '',
                restTime: s.rest_time?.toString() || '60',
                targetRpe: s.rpe?.toString() || '',
                targetType: (s.target_type as TargetType) || 'reps',
                isBodyweight: Boolean(s.is_bodyweight),
                cycleWeek: Number(s.cycle_week) || 1,
                notes: (s as { notes?: string | null }).notes || '',
              }));

              sets.sort((a, b) => (a.cycleWeek || 1) - (b.cycleWeek || 1));

              return {
                id: String(ex.id || Math.random()),
                name: String(ex.name || ''),
                category: String(ex.category || ''),
                notes: String((ex as { notes?: string | null }).notes || ''),
                setBlocks:
                  sets.length > 0
                    ? sets
                    : [
                        {
                          id: Math.random().toString(),
                          reps: '',
                          weight: '',
                          restTime: '60',
                          targetType: 'reps',
                          isBodyweight: false,
                          cycleWeek: 1,
                          notes: '',
                        },
                      ],
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

    useEffect(() => {
      let cancelled = false;

      const loadSuggestions = async () => {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user || cancelled) return;

        const coachOptions = await fetchCoachExerciseNameOptions(supabase, authData.user.id);
        let merged = coachOptions;

        if (mode === 'client' && targetUserId) {
          const clientOptions = await fetchClientExerciseOptions(supabase, targetUserId);
          const byKey = new Map<string, ExerciseNameSuggestion>();

          for (const opt of [...clientOptions, ...coachOptions]) {
            const key = opt.name.trim().toLowerCase();
            const existing = byKey.get(key);
            if (!existing) {
              byKey.set(key, opt);
            } else if (
              new Date(opt.lastDate).getTime() > new Date(existing.lastDate).getTime()
            ) {
              byKey.set(key, {
                name: opt.name,
                sessionCount: existing.sessionCount + opt.sessionCount,
                lastDate: opt.lastDate,
              });
            } else {
              byKey.set(key, {
                ...existing,
                sessionCount: existing.sessionCount + opt.sessionCount,
              });
            }
          }

          merged = [...byKey.values()].sort(
            (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime(),
          );
        }

        if (!cancelled) setExerciseSuggestions(merged);
      };

      void loadSuggestions();

      return () => {
        cancelled = true;
      };
    }, [mode, targetUserId, supabase]);

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
          }),
        );

        setCycleWeeks(newWeeks);
        if (activeCycleWeek > newWeeks) {
          setActiveCycleWeek(newWeeks);
        }
      },
      [activeCycleWeek],
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

    const applyExerciseFromHistory = useCallback(
      (payload: ApplyExerciseFromHistoryPayload) => {
        const allSets = buildSetBlocksForExercise(payload.sets, cycleWeeks, activeCycleWeek);

        setExercises((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            name: payload.name,
            category: '',
            setBlocks: allSets,
            notes: '',
          },
        ]);

        toast(`Liike "${payload.name}" lisätty ohjelmaan`, 'success');
      },
      [cycleWeeks, activeCycleWeek, toast],
    );

    const applyWorkoutFromHistory = useCallback(
      (payload: ApplyWorkoutFromHistoryPayload) => {
        const newExercises: ExerciseData[] = payload.exercises.map((ex) => ({
          id: Math.random().toString(),
          name: ex.name,
          category: '',
          notes: ex.notes || '',
          setBlocks: buildSetBlocksForExercise(ex.sets, cycleWeeks, activeCycleWeek),
        }));

        setExercises((prev) => [...prev, ...newExercises]);
        toast(
          newExercises.length === 1
            ? `Liike "${newExercises[0].name}" lisätty ohjelmaan`
            : `${newExercises.length} liikettä lisätty ohjelmaan`,
          'success',
        );
      },
      [cycleWeeks, activeCycleWeek, toast],
    );

    const applySetsToExercise = useCallback(
      (exerciseId: string, sets: ApplyExerciseFromHistoryPayload['sets']) => {
        const newBlocks = buildSetBlocksForExercise(sets, cycleWeeks, activeCycleWeek);

        setExercises((prev) =>
          prev.map((ex) => {
            if (ex.id !== exerciseId) return ex;

            const otherWeekBlocks = ex.setBlocks.filter(
              (b) => (b.cycleWeek ?? 1) !== activeCycleWeek,
            );
            const activeWeekBlocks = newBlocks.filter(
              (b) => (b.cycleWeek ?? 1) === activeCycleWeek,
            );

            return { ...ex, setBlocks: [...otherWeekBlocks, ...activeWeekBlocks] };
          }),
        );
      },
      [cycleWeeks, activeCycleWeek],
    );

    const fetchSetsForSuggestion = useCallback(
      async (exerciseName: string): Promise<ApplyExerciseFromHistoryPayload['sets'] | null> => {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) return null;

        if (mode === 'client' && targetUserId) {
          const { fetchExerciseSessionHistory } = await import('@/lib/sessions/exercise-history');
          const history = await fetchExerciseSessionHistory(
            supabase,
            targetUserId,
            authData.user.id,
            exerciseName,
          );
          const latest = history?.sessions[0];
          if (!latest) return null;
          return latest.sets.map((s) => ({
            weight: s.weightUsed?.toString() || '',
            reps: s.repsCompleted?.toString() || '',
            targetRpe: s.rpe?.toString() || '',
          }));
        }

        return fetchLatestPlannedSets(supabase, authData.user.id, exerciseName);
      },
      [mode, targetUserId, supabase],
    );

    const copyWeek = useCallback((fromWeek: number, toWeek: number) => {
      setExercises((prev) =>
        prev.map((ex) => {
          const sourceBlocks = ex.setBlocks.filter((b) => (b.cycleWeek ?? 1) === fromWeek);
          const otherBlocks = ex.setBlocks.filter((b) => (b.cycleWeek ?? 1) !== toWeek);
          const copiedBlocks = sourceBlocks.map((b) => ({
            ...b,
            id: Math.random().toString(),
            cycleWeek: toWeek,
          }));
          return { ...ex, setBlocks: [...otherBlocks, ...copiedBlocks] };
        }),
      );
      setActiveCycleWeek(toWeek);
      toast(`Viikko ${fromWeek} kopioitu viikolle ${toWeek}`, 'success');
    }, [toast]);

    const handleSave = useCallback(async () => {
      const errors: string[] = [];
      if (!programName.trim()) errors.push('Ohjelman nimi puuttuu');
      if (!workoutType) errors.push('Valitse treenin tyyppi');
      if (exercises.length === 0) errors.push('Lisää vähintään yksi liike');

      if (errors.length > 0) {
        setValidationErrors(errors);
        toast(errors[0], 'error');
        return;
      }

      setValidationErrors([]);

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
            weight: block.isBodyweight ? 0 : parseFloat(block.weight) || 0,
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

          if (
            mode === 'client' &&
            coachId &&
            data &&
            typeof data === 'object' &&
            'workout_id' in data
          ) {
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
    }, [
      programName,
      workoutType,
      exercises,
      supabase,
      toast,
      workoutId,
      notes,
      deloadCycle,
      cycleWeeks,
      programmedDeloads,
      mode,
      targetUserId,
      coachId,
      router,
      returnPath,
    ]);

    useImperativeHandle(
      ref,
      () => ({
        save: handleSave,
        addExercise: addManualExercise,
        applyExerciseFromHistory,
        applyWorkoutFromHistory,
        getExerciseNames: () =>
          exercises.map((ex) => ex.name.trim()).filter(Boolean),
      }),
      [handleSave, addManualExercise, applyExerciseFromHistory, applyWorkoutFromHistory, exercises],
    );

    if (initialLoading) {
      return (
        <div className="flex h-full min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    const builderBody = (
      <div className="space-y-4 pb-20 lg:pb-4">
        <ProgramSettingsStrip
          programName={programName}
          setProgramName={setProgramName}
          workoutType={workoutType}
          setWorkoutType={setWorkoutType}
          deloadCycle={deloadCycle}
          setDeloadCycle={setDeloadCycle}
          cycleWeeks={cycleWeeks}
          setCycleWeeks={updateCycleWeeks}
          notes={notes}
          setNotes={setNotes}
          hasErrors={validationErrors.length > 0}
        />

        {validationErrors.length > 0 && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <ul className="list-inside list-disc space-y-0.5">
              {validationErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <WeekNavigator
          cycleWeeks={cycleWeeks}
          activeCycleWeek={activeCycleWeek}
          setActiveCycleWeek={setActiveCycleWeek}
          programmedDeloads={programmedDeloads}
          setProgrammedDeloads={setProgrammedDeloads}
          deloadCycle={deloadCycle}
          weekViewMode={weekViewMode}
          setWeekViewMode={setWeekViewMode}
          syncSetsAcrossWeeks={syncSetsAcrossWeeks}
          setSyncSetsAcrossWeeks={setSyncSetsAcrossWeeks}
          completedWeekCounts={completedWeekCounts}
          onCopyWeek={copyWeek}
        />

        <ExerciseList
          exercises={exercises}
          setExercises={setExercises}
          cycleWeeks={cycleWeeks}
          programmedDeloads={programmedDeloads}
          activeCycleWeek={activeCycleWeek}
          weekViewMode={weekViewMode}
          syncSetsAcrossWeeks={syncSetsAcrossWeeks}
          completedWeekCounts={completedWeekCounts}
          exerciseSuggestions={exerciseSuggestions}
          onApplySetsToExercise={applySetsToExercise}
          onFetchSetsForSuggestion={fetchSetsForSuggestion}
        />

        <Button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="h-12 w-full bg-primary text-primary-foreground shadow-neon-sm hover:bg-primary/90 lg:hidden"
        >
          {loading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1.5 h-4 w-4" />
          )}
          Tallenna
        </Button>

        <Button
          onClick={addManualExercise}
          variant="outline"
          className="hidden w-full rounded-xl border-dashed py-8 glass-panel-hover lg:flex"
        >
          + Lisää uusi liike
        </Button>
      </div>
    );

    const mobileActionBar = hideMobileActionBar ? null : (
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={addManualExercise}
            className="h-11 w-full border-white/10 bg-white/[0.03]"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Liike
          </Button>
        </div>
      </div>
    );

    if (isContentOnly) {
      return (
        <>
          {builderBody}
          {mobileActionBar}
        </>
      );
    }

    return (
      <div className="flex h-full flex-col space-y-6">
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3 md:pb-4">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(returnPath)}
              className="shrink-0 rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl lg:text-2xl">
              {title}
            </h1>
          </div>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="hidden rounded-full bg-primary text-primary-foreground shadow-neon-sm hover:bg-primary/90 lg:inline-flex"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Tallenna
          </Button>
        </div>

        {builderBody}
        {mobileActionBar}
      </div>
    );
  },
);

export default WorkoutBuilder;
