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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

export default function SetBlockRow({ block, index, updateBlock, removeBlock }: Props) {
  const hasNotes = Boolean(block.notes?.trim());
  const [notesVisible, setNotesVisible] = useState(hasNotes);

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

  const tabBase = index * 10;
  const targetUnit =
    block.targetType === 'seconds' ? 's' : block.targetType === 'meters' ? 'm' : 'x';

  const notesField = notesVisible && (
    <Textarea
      value={block.notes || ''}
      onChange={(e) => updateBlock(block.id, 'notes', e.target.value)}
      placeholder={`Sarjan ${index + 1} erikoisohjeet...`}
      className="min-h-[60px] resize-none rounded-xl border-white/10 bg-black/40 text-xs focus-visible:ring-primary"
    />
  );

  const actionButtons = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setNotesVisible(!notesVisible)}
        title={hasNotes ? 'Muistiinpanot täytetty' : 'Lisää sarjamuistiinpanot'}
        className={cn(
          'relative min-h-[44px] min-w-[44px] rounded-full transition-colors md:min-h-0 md:min-w-0 md:h-8 md:w-8',
          notesVisible || hasNotes
            ? 'bg-primary/20 text-primary'
            : 'text-muted-foreground hover:bg-primary/10 hover:text-primary',
        )}
      >
        <MessageSquare className="h-4 w-4" />
        {hasNotes && !notesVisible && (
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeBlock(block.id)}
        className="min-h-[44px] min-w-[44px] rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive md:min-h-0 md:min-w-0 md:h-8 md:w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="w-full">
      {/* Mobile: card layout */}
      <div className="rounded-xl border border-white/8 bg-black/20 p-3 md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-bold text-muted-foreground">Sarja {index + 1}</span>
          {actionButtons}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Paino ({block.isBodyweight ? 'BW' : 'kg'})</FieldLabel>
            <Input
              value={block.weight}
              onChange={(e) => handleNumericInput('weight', e.target.value, false)}
              inputMode="decimal"
              placeholder="-"
              disabled={block.isBodyweight}
              tabIndex={tabBase + 1}
              className={cn(
                'h-11 border-white/5 bg-black/40 text-center font-bold',
                block.isBodyweight && 'opacity-50',
              )}
            />
          </div>
          <div>
            <FieldLabel>Tavoite ({targetUnit})</FieldLabel>
            <Input
              value={block.reps}
              onChange={(e) => handleNumericInput('reps', e.target.value, true)}
              inputMode="numeric"
              placeholder="-"
              tabIndex={tabBase + 2}
              className="h-11 border-white/5 bg-black/40 text-center font-bold"
            />
          </div>
          <div>
            <FieldLabel>Tauko (s)</FieldLabel>
            <Input
              value={block.restTime}
              onChange={(e) => handleNumericInput('restTime', e.target.value, true)}
              inputMode="numeric"
              placeholder="60"
              tabIndex={tabBase + 3}
              className="h-11 border-white/5 bg-black/40 text-center font-bold"
            />
          </div>
          <div>
            <FieldLabel>RPE</FieldLabel>
            <Input
              value={block.targetRpe || ''}
              onChange={(e) => handleNumericInput('targetRpe', e.target.value, false)}
              inputMode="decimal"
              placeholder="-"
              tabIndex={tabBase + 4}
              className="h-11 border-white/5 bg-black/40 text-center font-bold"
            />
          </div>
        </div>
        {notesVisible && <div className="mt-3">{notesField}</div>}
      </div>

      {/* Desktop: table row */}
      <div className="hidden flex-col gap-1 md:flex">
        <div className="group flex w-full items-center gap-2">
          <div className="w-8 text-center text-sm font-bold text-muted-foreground">{index + 1}</div>

          <div className="grid flex-1 grid-cols-4 gap-2">
            <div className="relative min-w-[80px]">
              <Input
                value={block.weight}
                onChange={(e) => handleNumericInput('weight', e.target.value, false)}
                inputMode="decimal"
                placeholder="-"
                disabled={block.isBodyweight}
                tabIndex={tabBase + 1}
                className={cn(
                  'h-10 rounded-lg border-white/5 bg-black/40 text-center font-bold focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary',
                  block.isBodyweight && 'opacity-50',
                )}
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-muted-foreground">
                {block.isBodyweight ? 'BW' : 'kg'}
              </span>
            </div>

            <div className="relative min-w-[70px]">
              <Input
                value={block.reps}
                onChange={(e) => handleNumericInput('reps', e.target.value, true)}
                inputMode="numeric"
                placeholder="-"
                tabIndex={tabBase + 2}
                className="h-10 rounded-lg border-white/5 bg-black/40 text-center font-bold focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-muted-foreground">
                {targetUnit}
              </span>
            </div>

            <div className="relative min-w-[60px]">
              <Input
                value={block.restTime}
                onChange={(e) => handleNumericInput('restTime', e.target.value, true)}
                inputMode="numeric"
                placeholder="60"
                tabIndex={tabBase + 3}
                className="h-10 rounded-lg border-white/5 bg-black/40 text-center font-bold focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-muted-foreground">
                s
              </span>
            </div>

            <div className="relative min-w-[60px]">
              <Input
                value={block.targetRpe || ''}
                onChange={(e) => handleNumericInput('targetRpe', e.target.value, false)}
                inputMode="decimal"
                placeholder="-"
                tabIndex={tabBase + 4}
                className="h-10 rounded-lg border-white/5 bg-black/40 text-center font-bold focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-muted-foreground">
                RPE
              </span>
            </div>
          </div>

          <div className="flex w-16 items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {actionButtons}
          </div>
        </div>

        {notesVisible && <div className="pl-10 pr-2 pb-1">{notesField}</div>}
      </div>
    </div>
  );
}
