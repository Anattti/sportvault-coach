'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ApplyExerciseFromHistoryPayload,
  ExerciseData,
  ExerciseNameSuggestion,
  SetBlock,
  WeekViewMode,
} from '@/lib/types/workout';
import { useState } from 'react';
import { GripVertical, Plus, Trash2, MessageSquare, BatteryLow, ChevronDown, Loader2 } from 'lucide-react';
import ExerciseNameAutocomplete from '@/components/workout/ExerciseNameAutocomplete';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { getCycleWeekStyle, groupSetBlocksByWeek } from '@/lib/workout/cycle-week-styles';
import SetBlockRow from './SetBlockRow';

interface Props {
  exercise: ExerciseData;
  cycleWeeks: number;
  programmedDeloads: number[];
  activeCycleWeek: number;
  weekViewMode: WeekViewMode;
  collapsedWeeks: Set<number>;
  onToggleWeek: (week: number) => void;
  updateExercise: <K extends keyof ExerciseData>(id: string, field: K, value: ExerciseData[K]) => void;
  removeExercise: (id: string) => void;
  updateSetBlock: <K extends keyof SetBlock>(exerciseId: string, blockId: string, field: K, value: SetBlock[K]) => void;
  removeSetBlock: (exerciseId: string, blockId: string) => void;
  addSetBlock: (exerciseId: string, sourceCycleWeek?: number) => void;
  exerciseSuggestions?: ExerciseNameSuggestion[];
  onApplySetsToExercise?: (
    exerciseId: string,
    sets: ApplyExerciseFromHistoryPayload['sets'],
  ) => void;
  onFetchSetsForSuggestion?: (
    exerciseName: string,
  ) => Promise<ApplyExerciseFromHistoryPayload['sets'] | null>;
}

export default function ExerciseItem({
  exercise,
  cycleWeeks,
  programmedDeloads,
  activeCycleWeek,
  weekViewMode,
  collapsedWeeks,
  onToggleWeek,
  updateExercise,
  removeExercise,
  updateSetBlock,
  removeSetBlock,
  addSetBlock,
  exerciseSuggestions = [],
  onApplySetsToExercise,
  onFetchSetsForSuggestion,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const [notesVisible, setNotesVisible] = useState(Boolean(exercise.notes?.trim()));
  const [pendingFillName, setPendingFillName] = useState<string | null>(null);
  const [fillPreview, setFillPreview] = useState<string | null>(null);
  const [fillLoading, setFillLoading] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const weekGroups = groupSetBlocksByWeek(exercise.setBlocks, cycleWeeks);
  const activeWeekBlocks =
    weekGroups.find((g) => g.week === activeCycleWeek)?.blocks ??
    weekGroups[0]?.blocks ??
    [];
  const firstWeekBlocks = weekGroups[0]?.blocks ?? [];
  const showWeekSections = cycleWeeks > 1 && weekViewMode === 'all';
  const hasNotes = Boolean(exercise.notes?.trim());

  const renderSetRows = (blocks: SetBlock[]) => (
    <>
      {blocks.length > 0 && (
        <div className="hidden w-full items-center gap-2 px-2 md:flex">
          <div className="w-8 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Sarja
          </div>
          <div className="grid flex-1 grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <div className="min-w-[80px]">Paino</div>
            <div className="min-w-[70px]">Tavoite</div>
            <div className="min-w-[60px]">Tauko</div>
            <div className="min-w-[60px]">RPE</div>
          </div>
          <div className="w-16" />
        </div>
      )}
      <div className="space-y-2">
        {blocks.map((block, index) => (
          <SetBlockRow
            key={block.id}
            block={block}
            index={index}
            updateBlock={(id, field, value) => updateSetBlock(exercise.id, id, field, value)}
            removeBlock={(id) => removeSetBlock(exercise.id, id)}
          />
        ))}
      </div>
    </>
  );

  const typeButtonClass = (active: boolean) =>
    cn(
      'h-9 flex-1 rounded-md px-1 text-[10px] font-bold tracking-wider md:min-h-6 md:h-6 md:min-w-0 md:flex-none md:px-2',
      active ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:text-white',
    );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'glass-panel mb-4 overflow-hidden rounded-2xl transition-colors',
        isDragging ? 'border-primary opacity-90 ring-1 ring-primary/50' : 'border-white/5',
      )}
    >
      <div className="flex flex-col gap-3 border-b border-white/5 bg-black/20 p-4 md:flex-row md:items-center">
        <div className="flex w-full items-center gap-3 md:min-w-0 md:flex-1">
          <div
            {...attributes}
            {...listeners}
            className="-m-1 flex min-h-[44px] min-w-[44px] cursor-grab items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground active:cursor-grabbing md:min-h-0 md:min-w-0 md:p-1"
          >
            <GripVertical size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <ExerciseNameAutocomplete
              value={exercise.name}
              onChange={(name) => {
                updateExercise(exercise.id, 'name', name);
                if (pendingFillName && name.trim().toLowerCase() !== pendingFillName.toLowerCase()) {
                  setPendingFillName(null);
                  setFillPreview(null);
                }
              }}
              onSuggestionSelected={async (name) => {
                if (!onFetchSetsForSuggestion || !onApplySetsToExercise) return;
                const sets = await onFetchSetsForSuggestion(name);
                if (!sets || sets.length === 0) return;

                const preview = sets
                  .slice(0, 3)
                  .map((s) => {
                    const w = s.weight ? `${s.weight} kg` : 'BW';
                    const r = s.reps || '—';
                    return `${w}×${r}`;
                  })
                  .join(', ');

                setPendingFillName(name);
                setFillPreview(
                  sets.length > 3 ? `${preview} +${sets.length - 3}` : preview,
                );
              }}
              suggestions={exerciseSuggestions}
              className="h-auto rounded-none border-0 bg-transparent px-0 text-lg font-bold focus-visible:text-primary focus-visible:ring-0"
            />
            {pendingFillName && fillPreview && onApplySetsToExercise && (
              <button
                type="button"
                disabled={fillLoading}
                onClick={async () => {
                  if (!onFetchSetsForSuggestion) return;
                  setFillLoading(true);
                  try {
                    const sets = await onFetchSetsForSuggestion(pendingFillName);
                    if (sets && sets.length > 0) {
                      onApplySetsToExercise(exercise.id, sets);
                      setPendingFillName(null);
                      setFillPreview(null);
                    }
                  } finally {
                    setFillLoading(false);
                  }
                }}
                className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-left text-xs text-primary transition-colors hover:bg-primary/20"
              >
                {fillLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Täytä viimeisimmät sarjat ({fillPreview})
              </button>
            )}
            {hasNotes && !notesVisible && (
              <button
                type="button"
                onClick={() => setNotesVisible(true)}
                className="mt-0.5 truncate text-left text-xs text-muted-foreground hover:text-primary"
              >
                {exercise.notes}
              </button>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotesVisible(!notesVisible)}
              className={cn(
                'min-h-[44px] min-w-[44px] rounded-full transition-colors',
                notesVisible || hasNotes
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
              )}
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeExercise(exercise.id)}
              className="min-h-[44px] min-w-[44px] rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div
          className="grid grid-cols-4 gap-1 pl-11 md:flex md:flex-wrap md:items-center md:gap-2 md:pl-0"
          title="Koskee kaikkia viikkoja"
        >
          <Button
            variant="ghost"
            size="sm"
            title="Toistot — koskee kaikkia viikkoja"
            onClick={() =>
              exercise.setBlocks.forEach((b) =>
                updateSetBlock(exercise.id, b.id, 'targetType', 'reps'),
              )
            }
            className={typeButtonClass(firstWeekBlocks[0]?.targetType === 'reps')}
          >
            REPS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Aika — koskee kaikkia viikkoja"
            onClick={() =>
              exercise.setBlocks.forEach((b) =>
                updateSetBlock(exercise.id, b.id, 'targetType', 'seconds'),
              )
            }
            className={typeButtonClass(firstWeekBlocks[0]?.targetType === 'seconds')}
          >
            AIKA
          </Button>
          <Button
            variant="ghost"
            size="sm"
            title="Matka — koskee kaikkia viikkoja"
            onClick={() =>
              exercise.setBlocks.forEach((b) =>
                updateSetBlock(exercise.id, b.id, 'targetType', 'meters'),
              )
            }
            className={typeButtonClass(firstWeekBlocks[0]?.targetType === 'meters')}
          >
            MATKA
          </Button>
          <div className="mx-1 hidden h-4 w-px bg-white/10 md:block" />
          <Button
            variant="ghost"
            size="sm"
            title="Oma paino — koskee kaikkia viikkoja"
            onClick={() =>
              exercise.setBlocks.forEach((b) =>
                updateSetBlock(
                  exercise.id,
                  b.id,
                  'isBodyweight',
                  !firstWeekBlocks[0]?.isBodyweight,
                ),
              )
            }
            className={typeButtonClass(Boolean(firstWeekBlocks[0]?.isBodyweight))}
          >
            BW
          </Button>
        </div>

        <div className="hidden shrink-0 items-center gap-1 md:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotesVisible(!notesVisible)}
            className={cn(
              'rounded-full transition-colors',
              notesVisible || hasNotes
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
            )}
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeExercise(exercise.id)}
            className="rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {notesVisible && (
        <div className="px-4 pb-0 pt-4">
          <Textarea
            value={exercise.notes || ''}
            onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
            placeholder="Liikkeen ohjeet urheilijalle..."
            className="min-h-[80px] resize-none rounded-xl border-white/10 bg-black/40 text-sm focus-visible:ring-primary"
          />
        </div>
      )}

      <div className="space-y-3 p-4">
        {showWeekSections ? (
          weekGroups.map(({ week, blocks }, groupIndex) => {
            const isDeload = programmedDeloads.includes(week);
            const weekStyle = getCycleWeekStyle(week, isDeload);
            const isCollapsed = collapsedWeeks.has(week);

            return (
              <div
                key={week}
                className={cn(
                  'overflow-hidden rounded-xl border transition-colors',
                  week === activeCycleWeek
                    ? cn('border-primary/30 ring-1', weekStyle.ring)
                    : 'border-white/10',
                  weekStyle.bg,
                  groupIndex > 0 && 'mt-1',
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggleWeek(week)}
                  className={cn(
                    'flex w-full items-center gap-2 border-b border-white/5 px-3 py-2 text-left transition-colors hover:bg-white/[0.03]',
                    weekStyle.bg,
                  )}
                  aria-expanded={!isCollapsed}
                >
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                      isCollapsed && '-rotate-90',
                    )}
                  />
                  <div className={cn('h-2 w-2 shrink-0 rounded-full', weekStyle.accent)} />
                  <span className={cn('text-xs font-bold uppercase tracking-wider', weekStyle.text)}>
                    Viikko {week}
                  </span>
                  {isDeload && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-400">
                      <BatteryLow size={10} />
                      Kevennys
                    </span>
                  )}
                  <span className="ml-auto text-[10px] font-medium tabular-nums text-muted-foreground">
                    {blocks.length} {blocks.length === 1 ? 'sarja' : 'sarjaa'}
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="space-y-2 p-3">
                    {blocks.length > 0 ? (
                      renderSetRows(blocks)
                    ) : (
                      <p className="py-2 text-center text-xs text-muted-foreground">Ei sarjoja</p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addSetBlock(exercise.id, week)}
                      className="h-9 w-full rounded-lg border border-dashed border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary"
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Lisää sarja
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="space-y-2">
            {cycleWeeks > 1 && weekViewMode === 'focused' && (
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Viikko {activeCycleWeek}
                {programmedDeloads.includes(activeCycleWeek) && (
                  <span className="ml-2 text-orange-400">Kevennys</span>
                )}
              </p>
            )}
            {renderSetRows(activeWeekBlocks)}
            <Button
              variant="ghost"
              onClick={() => addSetBlock(exercise.id, activeCycleWeek)}
              className="mt-2 w-full rounded-xl border border-dashed border-white/10 text-muted-foreground hover:border-primary/50 hover:text-primary"
            >
              <Plus className="mr-2 h-4 w-4" /> Lisää sarja
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
