import { Activity, Calendar, Dumbbell, Flame } from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import CycleWeekIndicator from '@/components/programs/CycleWeekIndicator';
import { Badge } from '@/components/ui/badge';
import { getWorkoutTypeConfig } from '@/lib/workouts/types';
import { WorkoutHistoryMeta } from '@/types';

interface WorkoutHistoryHeroProps {
  meta: WorkoutHistoryMeta;
}

export default function WorkoutHistoryHero({ meta }: WorkoutHistoryHeroProps) {
  const typeConfig = getWorkoutTypeConfig(meta.workoutType ?? '');
  const TypeIcon = typeConfig.icon;
  const hasCycle = meta.cycleWeeks != null && meta.cycleWeeks > 1 && meta.currentWeek != null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {meta.programName}
            </h2>
            {meta.workoutType && (
              <Badge
                variant="outline"
                className="border-white/10 bg-white/[0.03] text-muted-foreground"
              >
                <TypeIcon className="mr-1 h-3 w-3" />
                {typeConfig.label}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Liikkeet ja suoritukset viikkonumeroittain
          </p>
        </div>

        {hasCycle && (
          <CycleWeekIndicator
            currentWeek={meta.currentWeek!}
            totalWeeks={meta.cycleWeeks!}
            programmedDeloads={meta.programmedDeloads}
            align="right"
            variant="compact"
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Suorituksia"
          value={String(meta.totalSessions)}
          subtitle="Yhteensä"
          icon={Calendar}
        />
        <KpiCard
          title="Viimeisin volyymi"
          value={
            meta.latestVolume != null
              ? `${meta.latestVolume.toLocaleString('fi-FI')} kg`
              : '—'
          }
          subtitle="Uusin treeni"
          icon={Dumbbell}
        />
        <KpiCard
          title="Keskim. RPE"
          value={meta.avgRpe != null ? meta.avgRpe.toFixed(1) : '—'}
          subtitle="Kaikki suoritukset"
          icon={Flame}
          iconColorClassName="text-accent"
        />
        <KpiCard
          title="Jakson pituus"
          value={meta.cycleWeeks != null && meta.cycleWeeks > 1 ? `${meta.cycleWeeks} vk` : '—'}
          subtitle={
            meta.programmedDeloads.length > 0
              ? `${meta.programmedDeloads.length} deload-viikkoa`
              : 'Ei jaksoa'
          }
          icon={Activity}
        />
      </div>
    </div>
  );
}
