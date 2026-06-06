import Link from 'next/link';
import { Calendar, Clock, Dumbbell, LucideIcon, Pencil, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getWorkoutTypeConfig } from '@/lib/workouts/types';
import DeleteClientProgramButton from '@/components/programs/DeleteClientProgramButton';
import WorkoutUpdateMeta from '@/components/programs/WorkoutUpdateMeta';

interface ClientProgramCardProps {
  id: string;
  clientId: string;
  program: string;
  workoutType: string;
  duration: number | null;
  cycleWeeks: number | null;
  exerciseCount: number;
  managedByCoach: boolean;
  updatedAt: string;
  updatedBy?: string | null;
  ownerId: string;
  updaterNickname?: string | null;
  viewerId?: string;
}

function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/8">
      <div className="mb-1 flex items-center justify-center gap-1 text-muted-foreground">
        <Icon className="h-3 w-3 shrink-0" />
        <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-center text-sm font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function ClientProgramCard({
  id,
  clientId,
  program,
  workoutType,
  duration,
  cycleWeeks,
  exerciseCount,
  managedByCoach,
  updatedAt,
  updatedBy,
  ownerId,
  updaterNickname,
  viewerId,
}: ClientProgramCardProps) {
  const typeConfig = getWorkoutTypeConfig(workoutType);
  const TypeIcon = typeConfig.icon;
  const durationMin = Math.floor((duration ?? 0) / 60);

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl glass-panel',
        'transition-all duration-300 hover:border-white/15 hover:shadow-neon-sm',
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex flex-1 flex-col gap-5 p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <TypeIcon className="h-5 w-5 text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">
                {program}
              </h3>
              {managedByCoach && (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/25">
                  <Sparkles className="h-3 w-3" />
                  Valmentajan
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs font-medium capitalize text-muted-foreground">
              {typeConfig.label}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatChip
            icon={Calendar}
            label="Sykli"
            value={cycleWeeks != null ? `${cycleWeeks} vk` : '—'}
          />
          <StatChip
            icon={Clock}
            label="Kesto"
            value={durationMin > 0 ? `${durationMin} min` : '—'}
          />
          <StatChip icon={Dumbbell} label="Liikkeet" value={String(exerciseCount)} />
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-3 border-t border-white/8 bg-white/[0.02] px-5 py-3">
        <WorkoutUpdateMeta
          updatedAt={updatedAt}
          updatedBy={updatedBy}
          ownerId={ownerId}
          updaterNickname={updaterNickname}
          viewerId={viewerId}
          className="text-xs tabular-nums text-muted-foreground"
        />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
            render={<Link href={`/clients/${clientId}/programs/${id}/edit`} />}
            nativeButton={false}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Muokkaa
          </Button>
          <DeleteClientProgramButton workoutId={id} clientId={clientId} />
        </div>
      </div>
    </article>
  );
}
