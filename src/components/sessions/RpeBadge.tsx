import { Flame } from 'lucide-react';
import { formatRpe, getRpeStyles } from '@/lib/rpe';
import { cn } from '@/lib/utils';

interface RpeBadgeProps {
  rpe: number;
  size?: 'md' | 'lg' | 'xl';
  showPrefix?: boolean;
  className?: string;
}

const sizeClasses = {
  md: 'min-w-[2.75rem] h-9 px-2.5 text-sm',
  lg: 'min-w-[3.25rem] h-10 px-3 text-base',
  xl: 'min-w-[4.5rem] h-14 px-4 text-3xl',
} as const;

export default function RpeBadge({
  rpe,
  size = 'lg',
  showPrefix = false,
  className,
}: RpeBadgeProps) {
  const { color, backgroundColor } = getRpeStyles(rpe);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-lg border border-white/5 font-extrabold tabular-nums',
        sizeClasses[size],
        className,
      )}
      style={{ color, backgroundColor }}
    >
      {showPrefix ? `RPE ${formatRpe(rpe)}` : formatRpe(rpe)}
    </span>
  );
}

interface RpeKpiCardProps {
  rpeAverage: number | null;
}

export function RpeKpiCard({ rpeAverage }: RpeKpiCardProps) {
  const styles = rpeAverage != null ? getRpeStyles(rpeAverage) : null;

  return (
    <div className="glass-panel group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:border-white/15 hover:shadow-neon-sm">
      {styles && (
        <div
          className="absolute inset-0 opacity-80 transition-opacity duration-500 group-hover:opacity-100"
          style={{ backgroundColor: styles.backgroundColor }}
        />
      )}

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            RPE
          </p>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5"
            style={
              styles
                ? { backgroundColor: styles.backgroundColor, color: styles.color }
                : undefined
            }
          >
            <Flame
              className="h-4 w-4"
              style={styles ? { color: styles.color } : undefined}
            />
          </div>
        </div>

        <div>
          {rpeAverage != null ? (
            <RpeBadge rpe={rpeAverage} size="xl" />
          ) : (
            <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">—</p>
          )}
          {styles?.rir && (
            <p className="mt-2 text-xs font-semibold" style={{ color: styles.color }}>
              {styles.rir}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
