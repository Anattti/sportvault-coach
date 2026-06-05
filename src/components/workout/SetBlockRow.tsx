'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SetBlock } from '@/lib/types/workout';
import { X, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  block: SetBlock;
  index: number;
  updateBlock: <K extends keyof SetBlock>(id: string, field: K, value: SetBlock[K]) => void;
  removeBlock: (id: string) => void;
}

export default function SetBlockRow({ block, index, updateBlock, removeBlock }: Props) {
  const [notesVisible, setNotesVisible] = useState(false);

  const handleNumericInput = (field: keyof SetBlock, value: string, isInteger: boolean) => {
    let sanitized = value.replace(',', '.');
    
    if (isInteger) {
      sanitized = sanitized.replace(/[^0-9]/g, '');
    } else {
      sanitized = sanitized.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      if (parts.length > 2) {
        sanitized = parts[0] + '.' + parts.slice(1).join('');
      }
    }
    
    updateBlock(block.id, field, sanitized);
  };

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex items-center gap-2 w-full group">
      <div className="w-8 text-center text-sm font-bold text-muted-foreground">
        {index + 1}
      </div>
      
      <div className="flex-1 grid grid-cols-4 gap-2">
        {/* Weight */}
        <div className="relative">
          <Input 
            value={block.weight}
            onChange={(e) => handleNumericInput('weight', e.target.value, false)}
            inputMode="decimal"
            placeholder="-"
            disabled={block.isBodyweight}
            className={cn(
              "h-10 bg-black/40 border-white/5 rounded-lg text-center font-bold focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary pr-6",
              block.isBodyweight && "opacity-50"
            )}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase text-muted-foreground font-bold pointer-events-none">
            {block.isBodyweight ? 'BW' : 'kg'}
          </span>
        </div>

        {/* Reps */}
        <div className="relative">
          <Input 
            value={block.reps}
            onChange={(e) => handleNumericInput('reps', e.target.value, true)}
            inputMode="numeric"
            placeholder="-"
            className="h-10 bg-black/40 border-white/5 rounded-lg text-center font-bold focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary pr-6"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase text-muted-foreground font-bold pointer-events-none">
            {block.targetType === 'seconds' ? 's' : block.targetType === 'meters' ? 'm' : 'x'}
          </span>
        </div>

        {/* Rest */}
        <div className="relative">
          <Input 
            value={block.restTime}
            onChange={(e) => handleNumericInput('restTime', e.target.value, true)}
            inputMode="numeric"
            placeholder="60"
            className="h-10 bg-black/40 border-white/5 rounded-lg text-center font-bold focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary pr-6"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase text-muted-foreground font-bold pointer-events-none">
            s
          </span>
        </div>

        {/* RPE */}
        <div className="relative">
          <Input 
            value={block.targetRpe || ''}
            onChange={(e) => handleNumericInput('targetRpe', e.target.value, false)}
            inputMode="decimal"
            placeholder="-"
            className="h-10 bg-black/40 border-white/5 rounded-lg text-center font-bold focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase text-muted-foreground font-bold pointer-events-none">
            RPE
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setNotesVisible(!notesVisible)}
          className={`w-8 h-8 rounded-full transition-colors ${notesVisible ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeBlock(block.id)}
          className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      </div>

      {/* Set Notes */}
      {notesVisible && (
        <div className="pl-10 pr-2 pb-1">
          <Textarea
            value={block.notes || ''}
            onChange={(e) => updateBlock(block.id, 'notes', e.target.value)}
            placeholder={`Sarjan ${index + 1} erikoisohjeet...`}
            className="min-h-[60px] bg-black/40 border-white/10 rounded-xl resize-none focus-visible:ring-primary text-xs"
          />
        </div>
      )}
    </div>
  );
}
