import Link from 'next/link';
import { BatteryLow, ClipboardList, Target } from 'lucide-react';
import { ProgramCycleStatus } from '@/lib/programs/cycle-status';
import { getWorkoutTypeConfig } from '@/lib/workouts/types';
import CycleWeekIndicator from '@/components/programs/CycleWeekIndicator';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ActiveProgramCardProps {
  cycleStatus: ProgramCycleStatus;
  programLabel: string;
  hasAssignedProgram: boolean;
  clientId: string;
  workoutType?: string | null;
}

export default function ActiveProgramCard({
  cycleStatus,
  programLabel,
  hasAssignedProgram,
  clientId,
  workoutType,
}: ActiveProgramCardProps) {
  const typeConfig = workoutType ? getWorkoutTypeConfig(workoutType) : null;
  const TypeIcon = typeConfig?.icon ?? Target;

  if (
    cycleStatus.hasCycle &&
    cycleStatus.currentWeek != null &&
    cycleStatus.totalWeeks != null
  ) {
    return (
      <Card className="overflow-hidden rounded-2xl border-white/[0.06] bg-[#151515] ring-0">
        <CardContent className="p-5">
          <div className="mb-2.5 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/40">
                {typeConfig?.label ?? 'Aktiivinen ohjelma'}
              </p>
              {cycleStatus.isDeloadWeek && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-md border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-400">
                  <BatteryLow className="h-3 w-3" />
                  Deload-viikko
                </span>
              )}
            </div>

            <CycleWeekIndicator
              currentWeek={cycleStatus.currentWeek}
              totalWeeks={cycleStatus.totalWeeks}
              programmedDeloads={cycleStatus.programmedDeloads}
              programStuck={cycleStatus.programStuck}
              align="right"
            />
          </div>

          <h3 className="mb-4 truncate text-2xl font-semibold tracking-tight text-white">
            {cycleStatus.programName ?? programLabel}
          </h3>

          <div className="flex items-center gap-2 text-sm text-white/70">
            <TypeIcon className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              Syklissä viikko {cycleStatus.currentWeek} / {cycleStatus.totalWeeks}
            </span>
          </div>

          {cycleStatus.programStuck && (
            <p className="mt-3 text-xs font-medium text-purple-400">
              Sykliviikko ei etene — tarkista urheilijan eteneminen.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="flex h-full flex-col justify-center p-6">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Target className="h-4 w-4" />
          Aktiivinen ohjelma
        </div>
        <div className="text-2xl font-bold truncate">{programLabel}</div>
        {!hasAssignedProgram && (
          <Button
            variant="link"
            size="sm"
            className="mt-2 h-auto self-start p-0 text-primary"
            render={<Link href={`/clients/${clientId}/programs`} />}
            nativeButton={false}
          >
            <ClipboardList className="mr-1.5 h-3.5 w-3.5" />
            Määritä ohjelma
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
