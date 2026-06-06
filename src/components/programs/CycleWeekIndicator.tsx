import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CycleWeekIndicatorProps {
  currentWeek: number;
  totalWeeks: number;
  programmedDeloads?: number[];
  programStuck?: boolean;
  variant?: 'default' | 'compact';
  align?: 'left' | 'right';
  className?: string;
}

export default function CycleWeekIndicator({
  currentWeek,
  totalWeeks,
  programmedDeloads = [],
  programStuck = false,
  variant = 'default',
  align = 'left',
  className,
}: CycleWeekIndicatorProps) {
  const isCompact = variant === 'compact';
  const segmentWidth = totalWeeks > 6 ? 'w-2.5' : isCompact ? 'w-2.5' : 'w-3.5';

  return (
    <div
      className={cn(
        'flex flex-col gap-1',
        align === 'right' && 'items-end',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: totalWeeks }).map((_, index) => {
            const week = index + 1;
            const isFilled = week <= currentWeek;
            const isDeload = programmedDeloads.includes(week);

            return (
              <div
                key={week}
                className={cn(
                  'h-[3px] shrink-0 rounded-sm bg-white/10',
                  segmentWidth,
                  isFilled && (isDeload ? 'bg-orange-500' : 'bg-cyan-400'),
                )}
                aria-hidden="true"
              />
            );
          })}
        </div>

        {programStuck && (
          <span title="Sykliviikko ei etene">
            <AlertTriangle
              className={cn(
                'shrink-0 text-purple-400',
                isCompact ? 'h-3 w-3' : 'h-3.5 w-3.5',
              )}
              aria-label="Sykliviikko ei etene"
            />
          </span>
        )}
      </div>

      <p
        className={cn(
          'font-bold uppercase tracking-wide text-white/35 tabular-nums',
          isCompact ? 'text-[9px]' : 'text-[10px]',
        )}
      >
        Viikko {currentWeek}/{totalWeeks}
      </p>
    </div>
  );
}
