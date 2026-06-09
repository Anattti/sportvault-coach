'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WORKOUT_TYPES } from '@/components/workout/ProgramSettingsStrip';

interface Props {
  programName: string;
  setProgramName: (val: string) => void;
  workoutType: string;
  setWorkoutType: (val: string) => void;
  deloadCycle: number;
  setDeloadCycle: (val: number) => void;
  cycleWeeks: number;
  setCycleWeeks: (val: number) => void;
  notes: string;
  setNotes: (val: string) => void;
}

export default function CreateWorkoutSidebar({
  programName,
  setProgramName,
  workoutType,
  setWorkoutType,
  deloadCycle,
  setDeloadCycle,
  cycleWeeks,
  setCycleWeeks,
  notes,
  setNotes,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Ohjelman nimi
        </label>
        <Input
          placeholder="Esim. Yläkroppa Voima"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          className="rounded-none border-0 border-b border-white/10 bg-transparent px-0 text-lg font-bold focus-visible:border-primary focus-visible:ring-0"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Tyyppi
        </label>
        <Select value={workoutType} onValueChange={(v) => v && setWorkoutType(v)}>
          <SelectTrigger className="h-12 w-full rounded-xl border-white/10 bg-black/20">
            <SelectValue placeholder="Valitse tyyppi..." />
          </SelectTrigger>
          <SelectContent className="glass-panel border-white/10">
            {WORKOUT_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <type.icon size={16} className="text-accent" />
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Kesto (viikkoa)
          </label>
          <Select value={String(cycleWeeks)} onValueChange={(v) => v && setCycleWeeks(parseInt(v))}>
            <SelectTrigger className="w-full rounded-xl border-white/10 bg-black/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-panel border-white/10">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <SelectItem key={num} value={String(num)} className="cursor-pointer">
                  {num === 1 ? '1 viikko (ei jaksoa)' : `${num} viikkoa`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Kevennysviikko
          </label>
          <Select value={String(deloadCycle)} onValueChange={(v) => v && setDeloadCycle(parseInt(v))}>
            <SelectTrigger className="w-full rounded-xl border-white/10 bg-black/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-panel border-white/10">
              {[0, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <SelectItem key={num} value={String(num)} className="cursor-pointer">
                  {num === 0 ? 'Ei kevennysviikkoa' : `Joka ${num}. viikko`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2 border-t border-white/5 pt-4">
        <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Muistiinpanot
        </label>
        <Textarea
          placeholder="Lisää ohjeita valmennettavalle..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[120px] resize-none rounded-xl border-white/10 bg-black/20 focus-visible:ring-primary"
        />
      </div>
    </div>
  );
}
