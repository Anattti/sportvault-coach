'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ExerciseData, SetBlock } from '@/lib/types/workout';
import { useState } from 'react';
import { GripVertical, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import SetBlockRow from './SetBlockRow';

interface Props {
  exercise: ExerciseData;
  activeCycleWeek: number;
  updateExercise: <K extends keyof ExerciseData>(id: string, field: K, value: ExerciseData[K]) => void;
  removeExercise: (id: string) => void;
  updateSetBlock: <K extends keyof SetBlock>(exerciseId: string, blockId: string, field: K, value: SetBlock[K]) => void;
  removeSetBlock: (exerciseId: string, blockId: string) => void;
  addSetBlock: (exerciseId: string) => void;
}

export default function ExerciseItem({
  exercise,
  activeCycleWeek,
  updateExercise,
  removeExercise,
  updateSetBlock,
  removeSetBlock,
  addSetBlock
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const [notesVisible, setNotesVisible] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const currentWeekBlocks = exercise.setBlocks.filter(
    (b) => (b.cycleWeek ?? 1) === activeCycleWeek
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-panel rounded-2xl overflow-hidden mb-4 transition-colors ${
        isDragging ? 'border-primary ring-1 ring-primary/50 opacity-90' : 'border-white/5'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-black/20">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-white/5"
        >
          <GripVertical size={20} />
        </div>
        
        <div className="flex-1 flex flex-col gap-1">
          <Input 
            value={exercise.name}
            onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
            placeholder="Liikkeen nimi"
            className="text-lg font-bold border-0 bg-transparent px-0 h-auto focus-visible:ring-0 focus-visible:text-primary rounded-none"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exercise.setBlocks.forEach(b => updateSetBlock(exercise.id, b.id, 'targetType', 'reps'))}
              className={`h-6 px-2 text-[10px] font-bold tracking-wider rounded-md ${currentWeekBlocks[0]?.targetType === 'reps' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:text-white'}`}
            >
              REPS
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exercise.setBlocks.forEach(b => updateSetBlock(exercise.id, b.id, 'targetType', 'seconds'))}
              className={`h-6 px-2 text-[10px] font-bold tracking-wider rounded-md ${currentWeekBlocks[0]?.targetType === 'seconds' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:text-white'}`}
            >
              AIKA
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exercise.setBlocks.forEach(b => updateSetBlock(exercise.id, b.id, 'targetType', 'meters'))}
              className={`h-6 px-2 text-[10px] font-bold tracking-wider rounded-md ${currentWeekBlocks[0]?.targetType === 'meters' ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:text-white'}`}
            >
              MATKA
            </Button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => exercise.setBlocks.forEach(b => updateSetBlock(exercise.id, b.id, 'isBodyweight', !currentWeekBlocks[0]?.isBodyweight))}
              className={`h-6 px-2 text-[10px] font-bold tracking-wider rounded-md ${currentWeekBlocks[0]?.isBodyweight ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground hover:text-white'}`}
            >
              BW
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNotesVisible(!notesVisible)}
            className={`rounded-full transition-colors ${notesVisible ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeExercise(exercise.id)}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Exercise Notes */}
      {notesVisible && (
        <div className="px-4 pt-4 pb-0">
          <Textarea
            value={exercise.notes || ''}
            onChange={(e) => updateExercise(exercise.id, 'notes', e.target.value)}
            placeholder="Liikkeen ohjeet urheilijalle..."
            className="min-h-[80px] bg-black/40 border-white/10 rounded-xl resize-none focus-visible:ring-primary text-sm"
          />
        </div>
      )}

      {/* Sets */}
      <div className="p-4 space-y-4">
        {/* Table Headers */}
        {currentWeekBlocks.length > 0 && (
          <div className="flex items-center gap-2 w-full px-2">
            <div className="w-8 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Sarja</div>
            <div className="flex-1 grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <div>Paino</div>
              <div>Tavoite</div>
              <div>Tauko</div>
              <div>RPE</div>
            </div>
            <div className="w-8"></div>
          </div>
        )}

        <div className="space-y-2">
          {currentWeekBlocks.map((block, index) => (
            <SetBlockRow 
              key={block.id}
              block={block}
              index={index}
              updateBlock={(id, field, value) => updateSetBlock(exercise.id, id, field, value)}
              removeBlock={(id) => removeSetBlock(exercise.id, id)}
            />
          ))}
        </div>

        <Button
          variant="ghost"
          onClick={() => addSetBlock(exercise.id)}
          className="w-full mt-2 border border-dashed border-white/10 hover:border-primary/50 text-muted-foreground hover:text-primary rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Lisää sarja
        </Button>
      </div>
    </div>
  );
}
