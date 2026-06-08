import { formatCycleWeekLabel } from '@/lib/sessions/format';
import { cn } from '@/lib/utils';

interface SessionCycleBadgeProps {
  cycleWeek: number | null;
  cycleWeeks: number | null;
  className?: string;
}

export default function SessionCycleBadge({
  cycleWeek,
  cycleWeeks,
  className,
}: SessionCycleBadgeProps) {
  const label = formatCycleWeekLabel(cycleWeek, cycleWeeks);
  if (!label) return null;

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground',
        className,
      )}
      title={`Viikko ${label}`}
    >
      {label}
    </span>
  );
}
