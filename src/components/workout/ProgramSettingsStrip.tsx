'use client';

import { useState } from 'react';
import { Activity, ChevronDown, Dumbbell, Move, Rocket, Settings2, Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateWorkoutSidebar from '@/components/workout/CreateWorkoutSidebar';
import { cn } from '@/lib/utils';

export const WORKOUT_TYPES = [
  { id: 'endurance_basic', label: 'Peruskestävyys', icon: Activity },
  { id: 'endurance_max', label: 'Maksimikestävyys', icon: Zap },
  { id: 'strength', label: 'Voima', icon: Dumbbell },
  { id: 'speed_explosive', label: 'Nopeus & Räjähtävyys', icon: Rocket },
  { id: 'mobility', label: 'Liikkuvuus', icon: Move },
] as const;

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
  hasErrors?: boolean;
}

export default function ProgramSettingsStrip({
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
  hasErrors = false,
}: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const selectedType = WORKOUT_TYPES.find((t) => t.id === workoutType);
  const TypeIcon = selectedType?.icon ?? Activity;

  return (
    <div
      className={cn(
        'glass-panel flex flex-wrap items-center gap-3 rounded-2xl p-3 md:gap-4 md:p-4',
        hasErrors && 'ring-1 ring-destructive/50',
      )}
    >
      <div className="min-w-[140px] flex-1">
        <Input
          placeholder="Ohjelman nimi"
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          className="h-9 border-0 bg-transparent px-0 text-base font-bold focus-visible:ring-0 md:text-lg"
        />
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <Select value={workoutType} onValueChange={(v) => v && setWorkoutType(v)}>
          <SelectTrigger className="h-9 w-auto min-w-[160px] rounded-xl border-white/10 bg-black/20">
            <SelectValue placeholder="Tyyppi...">
              {selectedType ? (
                <span className="flex items-center gap-2">
                  <TypeIcon className="h-4 w-4 text-primary" />
                  {selectedType.label}
                </span>
              ) : null}
            </SelectValue>
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

        <Select value={String(cycleWeeks)} onValueChange={(v) => v && setCycleWeeks(parseInt(v))}>
          <SelectTrigger className="h-9 w-[130px] rounded-xl border-white/10 bg-black/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-panel border-white/10">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <SelectItem key={num} value={String(num)} className="cursor-pointer">
                {num === 1 ? '1 viikko' : `${num} vko`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(deloadCycle)} onValueChange={(v) => v && setDeloadCycle(parseInt(v))}>
          <SelectTrigger className="h-9 w-[150px] rounded-xl border-white/10 bg-black/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="glass-panel border-white/10">
            {[0, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <SelectItem key={num} value={String(num)} className="cursor-pointer">
                {num === 0 ? 'Ei kevennystä' : `Kevennys ${num}. vko`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        {selectedType && (
          <Badge variant="outline" className="border-white/10 bg-black/20">
            <TypeIcon className="mr-1 h-3 w-3" />
            {selectedType.label}
          </Badge>
        )}
        {cycleWeeks > 1 && (
          <Badge variant="outline" className="border-white/10 bg-black/20">
            {cycleWeeks} vko
          </Badge>
        )}
      </div>

      {notes.trim() && (
        <Badge variant="outline" className="hidden border-primary/30 bg-primary/10 text-primary md:inline-flex">
          Muistiinpanot
        </Badge>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="ml-auto border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
            />
          }
        >
          <Settings2 className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Asetukset</span>
          <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
        </SheetTrigger>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Ohjelman asetukset</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-6">
            <CreateWorkoutSidebar
              programName={programName}
              setProgramName={setProgramName}
              workoutType={workoutType}
              setWorkoutType={setWorkoutType}
              deloadCycle={deloadCycle}
              setDeloadCycle={setDeloadCycle}
              cycleWeeks={cycleWeeks}
              setCycleWeeks={setCycleWeeks}
              notes={notes}
              setNotes={setNotes}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
