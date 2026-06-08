'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { cn } from '@/lib/utils';
import { Dumbbell, Activity, Zap, Rocket, Move, BatteryLow } from 'lucide-react';

interface Props {
  programName: string;
  setProgramName: (val: string) => void;
  workoutType: string;
  setWorkoutType: (val: string) => void;
  deloadCycle: number;
  setDeloadCycle: (val: number) => void;
  cycleWeeks: number;
  setCycleWeeks: (val: number) => void;
  activeCycleWeek: number;
  setActiveCycleWeek: (val: number) => void;
  programmedDeloads: number[];
  setProgrammedDeloads: (val: number[]) => void;
  notes: string;
  setNotes: (val: string) => void;
}

const WORKOUT_TYPES = [
  { id: 'endurance_basic', label: 'Peruskestävyys', icon: Activity },
  { id: 'endurance_max', label: 'Maksimikestävyys', icon: Zap },
  { id: 'strength', label: 'Voima', icon: Dumbbell },
  { id: 'speed_explosive', label: 'Nopeus & Räjähtävyys', icon: Rocket },
  { id: 'mobility', label: 'Liikkuvuus', icon: Move },
];

export default function CreateWorkoutSidebar({
  programName,
  setProgramName,
  workoutType,
  setWorkoutType,
  deloadCycle,
  setDeloadCycle,
  cycleWeeks,
  setCycleWeeks,
  activeCycleWeek,
  setActiveCycleWeek,
  programmedDeloads,
  setProgrammedDeloads,
  notes,
  setNotes,
}: Props) {
  
  const toggleDeload = (week: number) => {
    if (programmedDeloads.includes(week)) {
      setProgrammedDeloads(programmedDeloads.filter((w) => w !== week));
    } else {
      setProgrammedDeloads([...programmedDeloads, week].sort((a, b) => a - b));
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 space-y-8">
      {/* Nimi */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ohjelman nimi</label>
        <Input 
          placeholder="Esim. Yläkroppa Voima" 
          value={programName}
          onChange={(e) => setProgramName(e.target.value)}
          className="text-lg font-bold border-0 border-b border-white/10 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary bg-transparent"
        />
      </div>

      {/* Tyyppi */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Tyyppi</label>
        <Select value={workoutType} onValueChange={(v) => v && setWorkoutType(v)}>
          <SelectTrigger className="w-full bg-black/20 border-white/10 rounded-xl h-12">
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

      {/* Jakson kesto */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Kesto (viikkoa)</label>
          <Select value={String(cycleWeeks)} onValueChange={(v) => v && setCycleWeeks(parseInt(v))}>
            <SelectTrigger className="w-full bg-black/20 border-white/10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-panel border-white/10">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map((num) => (
                <SelectItem key={num} value={String(num)} className="cursor-pointer">
                  {num === 1 ? '1 viikko (ei jaksoa)' : `${num} viikkoa`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Kevennysviikko</label>
          <Select value={String(deloadCycle)} onValueChange={(v) => v && setDeloadCycle(parseInt(v))}>
            <SelectTrigger className="w-full bg-black/20 border-white/10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-panel border-white/10">
              {[0,2,3,4,5,6,7,8].map((num) => (
                <SelectItem key={num} value={String(num)} className="cursor-pointer">
                  {num === 0 ? 'Ei kevennysviikkoa' : `Joka ${num}. viikko`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Viikkovälilehdet */}
      {cycleWeeks > 1 && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Treeni viikko</label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: cycleWeeks }).map((_, i) => {
              const week = i + 1;
              const isActive = activeCycleWeek === week;
              const isDeload = programmedDeloads.includes(week);
              
              return (
                <button
                  key={week}
                  onClick={() => setActiveCycleWeek(week)}
                  className={cn(
                    'px-4 py-2 rounded-full border transition-all flex items-center gap-1.5',
                    isActive 
                      ? 'bg-primary border-primary text-black font-bold' 
                      : 'bg-[#111] border-white/10 text-muted-foreground hover:bg-[#222]'
                  )}
                >
                  {isDeload && (
                    <BatteryLow size={14} className={isActive ? 'text-black' : 'text-primary'} />
                  )}
                  <span className={cn('text-sm font-bold', isActive ? 'text-black' : 'text-muted-foreground')}>
                    Vko {week}
                  </span>
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => toggleDeload(activeCycleWeek)}
            className={cn(
              "w-full mt-2 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
              programmedDeloads.includes(activeCycleWeek) 
                ? "bg-white/5 border-white/20 text-white" 
                : "bg-transparent border-white/10 text-muted-foreground hover:bg-white/5"
            )}
          >
            <BatteryLow 
              size={18} 
              className={programmedDeloads.includes(activeCycleWeek) ? 'text-primary' : 'text-muted-foreground'} 
            />
            <span className="font-semibold text-sm">
              {programmedDeloads.includes(activeCycleWeek) 
                ? 'Poista kevennysmerkintä'
                : 'Merkitse kevennysviikoksi'}
            </span>
          </button>
        </div>
      )}

      {/* Muistiinpanot */}
      <div className="space-y-2 pt-4 border-t border-white/5">
        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Muistiinpanot</label>
        <Textarea 
          placeholder="Lisää ohjeita valmennettavalle..." 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[120px] bg-black/20 border-white/10 rounded-xl resize-none focus-visible:ring-primary"
        />
      </div>
    </div>
  );
}
