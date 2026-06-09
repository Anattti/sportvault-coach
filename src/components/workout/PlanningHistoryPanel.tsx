'use client';

import { useEffect, useMemo, useState } from 'react';
import { parseISO } from 'date-fns';
import { Activity, Dumbbell, History, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  ExerciseSessionHistoryData,
  fetchClientExerciseOptions,
  fetchExerciseSessionHistory,
} from '@/lib/sessions/exercise-history';
import { fetchWorkoutHistory } from '@/lib/sessions/workout-history';
import { groupSessionsByWorkout } from '@/lib/sessions/workout-programs';
import WorkoutProgramPicker from '@/components/sessions/WorkoutProgramPicker';
import WorkoutHistoryTimeline from '@/components/sessions/WorkoutHistoryTimeline';
import ExercisePicker from '@/components/sessions/ExercisePicker';
import ExerciseSessionTimeline from '@/components/sessions/ExerciseSessionTimeline';
import { SessionSummary, WorkoutHistoryData } from '@/types';
import { ApplyExerciseFromHistoryPayload } from '@/lib/types/workout';
import { formatDateFi } from '@/lib/dates/fi';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PlanningHistoryPanelProps {
  sessionSummaries: SessionSummary[];
  workoutHistory?: WorkoutHistoryData | null;
  clientId: string;
  workoutId?: string;
  suggestedExerciseNames?: string[];
  onApplyFromHistory?: (payload: ApplyExerciseFromHistoryPayload) => void;
  className?: string;
}

type HistoryTab = 'workouts' | 'exercises';

function getInitialWorkoutId(
  programs: ReturnType<typeof groupSessionsByWorkout>,
  editingWorkoutId?: string,
): string | null {
  if (editingWorkoutId) return editingWorkoutId;
  return programs[0]?.workoutId ?? null;
}

export default function PlanningHistoryPanel({
  sessionSummaries,
  workoutHistory,
  clientId,
  workoutId,
  suggestedExerciseNames = [],
  onApplyFromHistory,
  className,
}: PlanningHistoryPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const programs = useMemo(
    () => groupSessionsByWorkout(sessionSummaries),
    [sessionSummaries],
  );

  const programExerciseNames = useMemo(
    () => workoutHistory?.exercises.map((exercise) => exercise.name) ?? [],
    [workoutHistory],
  );

  const mergedSuggestedNames = useMemo(() => {
    const names = new Set<string>();
    for (const name of [...suggestedExerciseNames, ...programExerciseNames]) {
      if (name.trim()) names.add(name.trim());
    }
    return [...names];
  }, [suggestedExerciseNames, programExerciseNames]);

  const [activeTab, setActiveTab] = useState<HistoryTab>('workouts');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(() =>
    getInitialWorkoutId(programs, workoutId),
  );
  const [history, setHistory] = useState<WorkoutHistoryData | null>(null);
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [workoutError, setWorkoutError] = useState<string | null>(null);

  const [exerciseOptions, setExerciseOptions] = useState<
    Awaited<ReturnType<typeof fetchClientExerciseOptions>>
  >([]);
  const [exerciseOptionsLoading, setExerciseOptionsLoading] = useState(false);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseSessionHistoryData | null>(null);
  const [exerciseLoading, setExerciseLoading] = useState(false);
  const [exerciseError, setExerciseError] = useState<string | null>(null);

  useEffect(() => {
    if (workoutId) return;
    if (programs.length === 0) {
      setSelectedWorkoutId(null);
      return;
    }
    setSelectedWorkoutId((current) => {
      if (current && programs.some((p) => p.workoutId === current)) return current;
      return programs[0]?.workoutId ?? null;
    });
  }, [programs, workoutId]);

  useEffect(() => {
    if (!selectedWorkoutId) {
      setHistory(null);
      return;
    }

    if (workoutHistory && selectedWorkoutId === workoutHistory.meta.workoutId) {
      setHistory(workoutHistory);
      setWorkoutError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setWorkoutLoading(true);
      setWorkoutError(null);

      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) throw new Error('Not authenticated');

        const result = await fetchWorkoutHistory(
          supabase,
          authData.user.id,
          clientId,
          selectedWorkoutId,
        );

        if (cancelled) return;

        if (!result) {
          setHistory(null);
          setWorkoutError('Treenin historiaa ei löytynyt.');
        } else {
          setHistory(result);
        }
      } catch {
        if (!cancelled) {
          setHistory(null);
          setWorkoutError('Treenin historian haku epäonnistui.');
        }
      } finally {
        if (!cancelled) setWorkoutLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [selectedWorkoutId, workoutHistory, clientId, supabase]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setExerciseOptionsLoading(true);
      try {
        const options = await fetchClientExerciseOptions(supabase, clientId);
        if (!cancelled) setExerciseOptions(options);
      } finally {
        if (!cancelled) setExerciseOptionsLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [clientId, supabase]);

  useEffect(() => {
    if (!selectedExerciseName) {
      setExerciseHistory(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setExerciseLoading(true);
      setExerciseError(null);

      try {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) throw new Error('Not authenticated');

        const result = await fetchExerciseSessionHistory(
          supabase,
          clientId,
          authData.user.id,
          selectedExerciseName,
        );

        if (cancelled) return;

        if (!result) {
          setExerciseHistory(null);
          setExerciseError('Liikehistoriaa ei löytynyt.');
        } else {
          setExerciseHistory(result);
        }
      } catch {
        if (!cancelled) {
          setExerciseHistory(null);
          setExerciseError('Liikehistorian haku epäonnistui.');
        }
      } finally {
        if (!cancelled) setExerciseLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [selectedExerciseName, clientId, supabase]);

  const selectedProgram = programs.find((p) => p.workoutId === selectedWorkoutId);
  const selectedTitle =
    selectedProgram?.workoutName ??
    (history?.meta.workoutId === selectedWorkoutId ? history.meta.programName : null);

  if (sessionSummaries.length === 0) {
    return (
      <div
        className={cn(
          'glass-panel rounded-2xl p-6 text-center text-sm text-muted-foreground',
          className,
        )}
      >
        <Activity className="mx-auto mb-2 h-6 w-6 opacity-40" />
        <p>Ei vielä suoritettuja treenejä.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex gap-1 rounded-lg bg-white/5 p-1 ring-1 ring-white/8">
        <button
          type="button"
          onClick={() => setActiveTab('workouts')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-all',
            activeTab === 'workouts'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
          )}
        >
          <History className="h-3.5 w-3.5" />
          Treenit
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('exercises')}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-all',
            activeTab === 'exercises'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
          )}
        >
          <Dumbbell className="h-3.5 w-3.5" />
          Liikkeet
        </button>
      </div>

      {activeTab === 'workouts' ? (
        <div className="space-y-5">
          <section>
            <WorkoutProgramPicker
              programs={programs}
              selectedWorkoutId={selectedWorkoutId}
              onSelect={setSelectedWorkoutId}
              activeWorkoutId={workoutId}
            />
          </section>

          {selectedWorkoutId && (
            <section className="space-y-3">
              {selectedTitle && (
                <div className="px-1">
                  <h3 className="text-sm font-semibold text-foreground">{selectedTitle}</h3>
                  {selectedProgram && (
                    <p className="text-xs text-muted-foreground">
                      {selectedProgram.sessionCount}{' '}
                      {selectedProgram.sessionCount === 1 ? 'suoritus' : 'suoritusta'}
                      {' · '}
                      Viimeisin {formatDateFi(parseISO(selectedProgram.latestSession.date))}
                    </p>
                  )}
                </div>
              )}

              {workoutLoading && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {workoutError && !workoutLoading && (
                <p className="px-1 text-xs text-muted-foreground">{workoutError}</p>
              )}

              {history && !workoutLoading && history.meta.totalSessions > 0 && (
                <WorkoutHistoryTimeline
                  data={history}
                  clientId={clientId}
                  variant="embedded"
                />
              )}

              {!workoutLoading && history?.meta.totalSessions === 0 && (
                <p className="px-1 text-xs text-muted-foreground">
                  Tällä ohjelmalla ei vielä suorituksia.
                </p>
              )}
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {exerciseOptionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <ExercisePicker
              exercises={exerciseOptions}
              selectedExerciseName={selectedExerciseName}
              onSelect={setSelectedExerciseName}
              suggestedNames={mergedSuggestedNames}
            />
          )}

          {selectedExerciseName && (
            <section className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2 px-1">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{selectedExerciseName}</h3>
                  {exerciseHistory && (
                    <p className="text-xs text-muted-foreground">
                      Kaikki suoritukset uusimmasta vanhimpaan
                    </p>
                  )}
                </div>
                {onApplyFromHistory &&
                  exerciseHistory &&
                  !exerciseLoading &&
                  exerciseHistory.sessions.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const latest = exerciseHistory.sessions[0];
                        onApplyFromHistory({
                          name: exerciseHistory.exerciseName,
                          sets: latest.sets.map((s) => ({
                            weight: s.weightUsed?.toString() || '',
                            reps: s.repsCompleted?.toString() || '',
                            targetRpe: s.rpe?.toString() || '',
                          })),
                        });
                      }}
                      className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Lisää ohjelmaan
                    </Button>
                  )}
              </div>

              {exerciseLoading && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}

              {exerciseError && !exerciseLoading && (
                <p className="px-1 text-xs text-muted-foreground">{exerciseError}</p>
              )}

              {exerciseHistory && !exerciseLoading && (
                <ExerciseSessionTimeline
                  data={exerciseHistory}
                  clientId={clientId}
                  embedded
                />
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
