import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  iconClassName?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClassName,
  trend = 'neutral',
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl p-5 transition-all duration-300',
        'hover:border-white/15 hover:shadow-neon-sm',
        'relative overflow-hidden group',
        className,
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              'bg-primary/10 ring-1 ring-primary/20',
              iconClassName,
            )}
          >
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>

        <div>
          <p className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
          {subtitle && (
            <p
              className={cn(
                'mt-1.5 text-xs font-medium',
                trend === 'up' && 'text-primary',
                trend === 'down' && 'text-destructive',
                trend === 'neutral' && 'text-muted-foreground',
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
