import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import {
  AlertTriangle,
  ClipboardList,
  Flame,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { ClientAttentionAlert } from '@/lib/clients/attention';
import { cn } from '@/lib/utils';

interface ClientAttentionBannerProps {
  alerts: ClientAttentionAlert[];
  clientId: string;
}

const reasonConfig = {
  inactive: {
    label: 'Ei treeniä 7+ pv',
    icon: AlertTriangle,
    color: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  no_sessions: {
    label: 'Ei treenihistoriaa',
    icon: AlertTriangle,
    color: 'text-orange-400',
    dot: 'bg-orange-400',
  },
  pending: {
    label: 'Odottaa hyväksyntää',
    icon: AlertTriangle,
    color: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  high_rpe: {
    label: 'Korkea RPE',
    icon: Flame,
    color: 'text-red-400',
    dot: 'bg-red-400',
  },
  volume_spike: {
    label: 'Volyymipiikki',
    icon: TrendingUp,
    color: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  no_program: {
    label: 'Ei ohjelmaa',
    icon: ClipboardList,
    color: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  program_stuck: {
    label: 'Ohjelma jumissa',
    icon: RotateCcw,
    color: 'text-purple-400',
    dot: 'bg-purple-400',
  },
} as const;

function getDetailText(alert: ClientAttentionAlert): string {
  if (alert.detail) return alert.detail;

  switch (alert.reason) {
    case 'inactive':
      return alert.lastSessionDate
        ? `Viimeisin treeni ${formatDistanceToNow(new Date(alert.lastSessionDate), { addSuffix: true, locale: fi })}`
        : 'Ei treenihistoriaa';
    case 'no_sessions':
      return 'Ei vielä yhtään kirjattua treeniä';
    case 'pending':
      return 'Kutsu lähetetty, odottaa liittymistä';
    case 'high_rpe':
      return 'Harkitse kuormituksen säätöä';
    case 'volume_spike':
      return 'Kuormitus noussut nopeasti';
    case 'no_program':
      return 'Lisää treeniohjelma asiakkaalle';
    case 'program_stuck':
      return 'Jakson viikko ei etene';
    default:
      return '';
  }
}

export default function ClientAttentionBanner({
  alerts,
  clientId,
}: ClientAttentionBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 ring-1 ring-amber-500/10">
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-500/10 blur-2xl" />

      <div className="relative flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/25">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {alerts.length === 1
              ? 'Huomioitavaa'
              : `${alerts.length} huomiota`}
          </p>
          <ul className="mt-2 space-y-2">
            {alerts.map((alert) => {
              const config = reasonConfig[alert.reason];
              const Icon = config.icon;
              const detail = getDetailText(alert);
              const href =
                alert.reason === 'no_program'
                  ? `/clients/${clientId}/programs`
                  : null;

              return (
                <li key={alert.reason} className="flex items-start gap-2 text-xs">
                  <span
                    className={cn(
                      'mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                      config.dot,
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', config.color)} />
                      <span className={cn('font-medium', config.color)}>
                        {config.label}
                      </span>
                    </div>
                    {detail && (
                      <p className="mt-0.5 text-muted-foreground">{detail}</p>
                    )}
                    {href && (
                      <Link
                        href={href}
                        className="mt-1 inline-block font-medium text-primary hover:underline"
                      >
                        Määritä ohjelma →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
