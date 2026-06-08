import {
  Activity,
  CheckCircle2,
  Dumbbell,
  Flame,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import KpiCard from '@/components/dashboard/KpiCard';
import { DevelopmentSummary } from '@/types';
import { cn } from '@/lib/utils';

interface DevelopmentHeroProps {
  summary: DevelopmentSummary;
  periodWeeks: number;
  compact?: boolean;
}

function formatPercent(value: number | null, suffix = ''): string {
  if (value == null) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value} %${suffix}`;
}

function trendFromSummary(trend: 'up' | 'down' | 'neutral') {
  if (trend === 'up') return 'up' as const;
  if (trend === 'down') return 'down' as const;
  return 'neutral' as const;
}

export default function DevelopmentHero({
  summary,
  periodWeeks,
  compact = false,
}: DevelopmentHeroProps) {
  const cards = [
    {
      title: 'Voima',
      value: formatPercent(summary.strengthChangePercent),
      subtitle: `${periodWeeks} vk vs edellinen`,
      icon: Dumbbell,
      trend: trendFromSummary(summary.strengthTrend),
    },
    {
      title: 'Volyymi',
      value: formatPercent(summary.volumeChangePercent),
      subtitle: `${periodWeeks} vk vs edellinen`,
      icon: Activity,
      trend: trendFromSummary(summary.volumeTrend),
    },
    {
      title: 'Ennätykset',
      value: String(summary.prCount),
      subtitle: `Uutta PR:tä ${periodWeeks} vk`,
      icon: TrendingUp,
      trend: summary.prCount > 0 ? ('up' as const) : ('neutral' as const),
    },
    {
      title: 'Noudattaminen',
      value: summary.compliancePercent != null ? `${summary.compliancePercent} %` : '—',
      subtitle: 'Tämän viikon tavoite',
      icon: CheckCircle2,
      trend:
        summary.compliancePercent != null && summary.compliancePercent >= 80
          ? ('up' as const)
          : summary.compliancePercent != null && summary.compliancePercent < 60
            ? ('down' as const)
            : ('neutral' as const),
    },
  ];

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>
      <div
        className={cn(
          'glass-panel rounded-2xl flex items-start gap-3',
          compact ? 'px-4 py-3' : 'px-5 py-4',
        )}
      >
        {summary.strengthTrend === 'up' || summary.volumeTrend === 'up' ? (
          <TrendingUp className="h-5 w-5 shrink-0 text-primary mt-0.5" />
        ) : summary.strengthTrend === 'down' || summary.volumeTrend === 'down' ? (
          <TrendingDown className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
        ) : (
          <Flame className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" />
        )}
        <p
          className={cn(
            'text-muted-foreground leading-relaxed',
            compact ? 'text-xs' : 'text-sm',
          )}
        >
          {summary.interpretation}
        </p>
      </div>
    </div>
  );
}
