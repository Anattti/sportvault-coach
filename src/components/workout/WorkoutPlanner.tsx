'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, History, Loader2, Pin, PinOff, Plus, Save } from 'lucide-react';
import WorkoutBuilder, {
  WorkoutBuilderHandle,
  WorkoutBuilderProps,
} from '@/components/workout/WorkoutBuilder';
import PlanningHistoryPanel, {
  PlanningHistoryNavState,
} from '@/components/workout/PlanningHistoryPanel';
import ResizableHistoryAside from '@/components/workout/ResizableHistoryAside';
import { groupSessionsByWorkout } from '@/lib/sessions/workout-programs';
import {
  ApplyExerciseFromHistoryPayload,
  ApplyWorkoutFromHistoryPayload,
  ExerciseData,
} from '@/lib/types/workout';
import { SessionSummary, WorkoutHistoryData } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const HISTORY_PINNED_KEY = 'sportvault-coach-history-pinned';

function readHistoryPinnedPreference(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem(HISTORY_PINNED_KEY);
    if (stored === null) return true;
    return stored === 'true';
  } catch {
    return true;
  }
}

function persistHistoryPinned(pinned: boolean) {
  try {
    localStorage.setItem(HISTORY_PINNED_KEY, String(pinned));
  } catch {
    // ignore
  }
}

function readIsLargeScreen(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(min-width: 1024px)').matches;
}

export interface WorkoutPlannerProps extends WorkoutBuilderProps {
  sessionSummaries: SessionSummary[];
  workoutHistory?: WorkoutHistoryData | null;
  clientId: string;
}

export default function WorkoutPlanner({
  sessionSummaries,
  workoutHistory,
  clientId,
  title,
  returnPath,
  workoutId,
  ...builderProps
}: WorkoutPlannerProps) {
  const router = useRouter();
  const builderRef = useRef<WorkoutBuilderHandle>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const savedHistoryScrollTopRef = useRef(0);
  const [saving, setSaving] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPinned, setHistoryPinned] = useState(true);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [suggestedExerciseNames, setSuggestedExerciseNames] = useState<string[]>([]);

  const programs = useMemo(
    () => groupSessionsByWorkout(sessionSummaries),
    [sessionSummaries],
  );

  const [historyNavState, setHistoryNavState] = useState<PlanningHistoryNavState>(() => ({
    activeTab: 'workouts',
    selectedWorkoutId: workoutId ?? programs[0]?.workoutId ?? null,
    selectedExerciseName: null,
  }));

  const setPinnedHistory = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setHistoryPinned((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      persistHistoryPinned(value);
      return value;
    });
  }, []);

  useEffect(() => {
    setHistoryPinned(readHistoryPinnedPreference());
    setIsLargeScreen(readIsLargeScreen());
    setLayoutReady(true);

    const media = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsLargeScreen(media.matches);

    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const handleExercisesChange = useCallback((exerciseList: ExerciseData[]) => {
    const names = exerciseList.map((ex) => ex.name.trim()).filter(Boolean);
    setSuggestedExerciseNames((prev) => {
      if (prev.length === names.length && prev.every((name, index) => name === names[index])) {
        return prev;
      }
      return names;
    });
  }, []);

  const handleApplyFromHistory = (payload: ApplyExerciseFromHistoryPayload) => {
    builderRef.current?.applyExerciseFromHistory(payload);
    setHistoryOpen(false);
  };

  const handleApplyWorkoutFromHistory = (payload: ApplyWorkoutFromHistoryPayload) => {
    builderRef.current?.applyWorkoutFromHistory(payload);
    setHistoryOpen(false);
  };

  const handleHistoryOpenChange = useCallback((open: boolean) => {
    if (!open && historyScrollRef.current) {
      savedHistoryScrollTopRef.current = historyScrollRef.current.scrollTop;
    }
    setHistoryOpen(open);
    if (open) {
      requestAnimationFrame(() => {
        if (historyScrollRef.current) {
          historyScrollRef.current.scrollTop = savedHistoryScrollTopRef.current;
        }
      });
    }
  }, []);

  const showPinnedHistory = layoutReady && historyPinned && isLargeScreen;

  const historyPanel = (
    <PlanningHistoryPanel
      sessionSummaries={sessionSummaries}
      workoutHistory={workoutHistory}
      clientId={clientId}
      workoutId={workoutId}
      suggestedExerciseNames={suggestedExerciseNames}
      navState={historyNavState}
      onNavStateChange={setHistoryNavState}
      onApplyFromHistory={handleApplyFromHistory}
      onApplyWorkoutFromHistory={handleApplyWorkoutFromHistory}
    />
  );

  const mobileActionBar = (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/95 p-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => builderRef.current?.addExercise()}
          className="h-11 flex-1 border-white/10 bg-white/[0.03]"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Liike
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleHistoryOpenChange(true)}
          className="h-11 flex-1 border-white/10 bg-white/[0.03]"
        >
          <History className="mr-1.5 h-4 w-4 text-primary" />
          Historia
          {sessionSummaries.length > 0 && (
            <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1.5 text-[10px]">
              {sessionSummaries.length}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col space-y-4 md:space-y-6">
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Sheet open={historyOpen} onOpenChange={handleHistoryOpenChange}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'hidden border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground lg:inline-flex',
                    showPinnedHistory && 'lg:hidden',
                  )}
                />
              }
            >
              <History className="h-4 w-4 text-primary sm:mr-1.5" />
              <span className="hidden sm:inline">Historia</span>
              {sessionSummaries.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-0 h-5 min-w-5 px-1.5 text-[10px] sm:ml-1.5"
                >
                  {sessionSummaries.length}
                </Badge>
              )}
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-full flex-col gap-0 p-0 sm:max-w-lg lg:max-w-xl"
            >
              <SheetHeader className="shrink-0 border-b border-white/8">
                <SheetTitle>Treenihistoria</SheetTitle>
              </SheetHeader>
              <div
                ref={historyScrollRef}
                className="flex-1 overflow-y-auto px-4 pb-6 pt-4"
              >
                {historyPanel}
              </div>
            </SheetContent>
          </Sheet>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setPinnedHistory((p) => !p)}
            className="hidden border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground lg:inline-flex"
            title={historyPinned ? 'Irrota historia' : 'Kiinnitä historia'}
          >
            {historyPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
          </Button>

          <Button
            onClick={() => builderRef.current?.save()}
            disabled={saving}
            className="hidden rounded-full bg-primary text-primary-foreground shadow-neon-sm hover:bg-primary/90 lg:inline-flex"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Tallenna
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-start">
        {showPinnedHistory && (
          <ResizableHistoryAside onUnpin={() => setPinnedHistory(false)}>
            {historyPanel}
          </ResizableHistoryAside>
        )}

        <div className="min-w-0 flex-1">
          <WorkoutBuilder
            ref={builderRef}
            variant="content-only"
            hideMobileActionBar
            title={title}
            returnPath={returnPath}
            workoutId={workoutId}
            onLoadingChange={setSaving}
            onExercisesChange={handleExercisesChange}
            {...builderProps}
          />
        </div>
      </div>

      {mobileActionBar}
    </div>
  );
}
