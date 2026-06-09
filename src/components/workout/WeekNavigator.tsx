'use client';

import { BatteryLow, Copy, Layers, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WeekViewMode } from '@/lib/types/workout';
import CopyWeekDialog from '@/components/workout/CopyWeekDialog';

interface Props {
  cycleWeeks: number;
  activeCycleWeek: number;
  setActiveCycleWeek: (week: number) => void;
  programmedDeloads: number[];
  setProgrammedDeloads: (val: number[]) => void;
  deloadCycle: number;
  weekViewMode: WeekViewMode;
  setWeekViewMode: (mode: WeekViewMode) => void;
  syncSetsAcrossWeeks: boolean;
  setSyncSetsAcrossWeeks: (val: boolean) => void;
  onCopyWeek: (fromWeek: number, toWeek: number) => void;
}

export default function WeekNavigator({
  cycleWeeks,
  activeCycleWeek,
  setActiveCycleWeek,
  programmedDeloads,
  setProgrammedDeloads,
  deloadCycle,
  weekViewMode,
  setWeekViewMode,
  syncSetsAcrossWeeks,
  setSyncSetsAcrossWeeks,
  onCopyWeek,
}: Props) {
  if (cycleWeeks <= 1) return null;

  const toggleDeload = (week: number) => {
    if (programmedDeloads.includes(week)) {
      setProgrammedDeloads(programmedDeloads.filter((w) => w !== week));
    } else {
      setProgrammedDeloads([...programmedDeloads, week].sort((a, b) => a - b));
    }
  };

  const activeWeekIsDeload = programmedDeloads.includes(activeCycleWeek);

  return (
    <div className="z-0 space-y-3 rounded-2xl border border-white/10 bg-background/95 p-3 backdrop-blur-sm md:p-4 lg:sticky lg:top-0 lg:z-10">
      {/* Viikot — aina oma rivi, ei päällekkäisyyksiä */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.from({ length: cycleWeeks }).map((_, i) => {
          const week = i + 1;
          const isActive = activeCycleWeek === week;
          const isDeload = programmedDeloads.includes(week);

          return (
            <div key={week} className="group relative shrink-0">
              <button
                type="button"
                onClick={() => setActiveCycleWeek(week)}
                className={cn(
                  'flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 transition-all',
                  isActive
                    ? 'border-primary bg-primary font-bold text-black'
                    : 'border-white/10 bg-[#111] text-muted-foreground hover:bg-[#222]',
                )}
              >
                {isDeload && (
                  <BatteryLow
                    size={14}
                    className={isActive ? 'text-black' : 'text-orange-400'}
                  />
                )}
                <span className="text-sm font-bold">Vko {week}</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDeload(week);
                }}
                title={
                  isDeload ? 'Poista kevennysmerkintä' : 'Merkitse kevennysviikoksi'
                }
                className={cn(
                  'absolute -right-1 -top-1 flex items-center justify-center rounded-full border transition-colors',
                  'h-7 w-7 max-lg:opacity-100 lg:h-5 lg:w-5',
                  isDeload
                    ? 'border-orange-400/50 bg-orange-500/20 text-orange-400 opacity-100'
                    : 'border-white/10 bg-black/80 text-muted-foreground lg:opacity-0 lg:group-hover:opacity-100',
                )}
                aria-label={
                  isDeload
                    ? `Poista viikon ${week} kevennysmerkintä`
                    : `Merkitse viikko ${week} kevennysviikoksi`
                }
              >
                <BatteryLow size={12} />
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => toggleDeload(activeCycleWeek)}
        className={cn(
          'flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors lg:hidden',
          activeWeekIsDeload
            ? 'border-orange-400/30 bg-orange-500/10 text-orange-400'
            : 'border-white/10 bg-white/[0.03] text-muted-foreground',
        )}
      >
        <BatteryLow size={16} />
        {activeWeekIsDeload
          ? `Poista viikon ${activeCycleWeek} kevennysmerkintä`
          : `Merkitse viikko ${activeCycleWeek} kevennysviikoksi`}
      </button>

      {/* Toiminnot — oma rivi, flex-wrap */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-white/5 p-0.5 ring-1 ring-white/8">
          <button
            type="button"
            onClick={() => setWeekViewMode('focused')}
            title="Näytä vain valittu viikko"
            className={cn(
              'flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all',
              weekViewMode === 'focused'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Fokus
          </button>
          <button
            type="button"
            onClick={() => setWeekViewMode('all')}
            title="Näytä kaikki viikot liikkeittäin"
            className={cn(
              'flex min-h-[36px] items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all',
              weekViewMode === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            Kaikki
          </button>
        </div>

        <CopyWeekDialog
          cycleWeeks={cycleWeeks}
          activeCycleWeek={activeCycleWeek}
          onCopy={onCopyWeek}
          trigger={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[36px] border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
            >
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              Kopioi viikko
            </Button>
          }
        />
      </div>

      <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {deloadCycle > 0
            ? `Automaattinen kevennys: joka ${deloadCycle}. viikko`
            : 'Ei automaattista kevennysjaksoa'}
          {programmedDeloads.length > 0 && (
            <span className="ml-1 text-orange-400/80">
              · Merkitty: vko {programmedDeloads.join(', ')}
            </span>
          )}
        </p>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={syncSetsAcrossWeeks}
            onChange={(e) => setSyncSetsAcrossWeeks(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
          />
          <span>Synkronoi sarjat kaikkiin viikkoihin</span>
        </label>
      </div>
    </div>
  );
}
