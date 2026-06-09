import Link from 'next/link';
import { AlertTriangle, ClipboardList, Flame, RotateCcw, TrendingUp } from 'lucide-react';
import { AttentionClient } from '@/types';
import { cn } from '@/lib/utils';

interface AttentionBannerProps {
  clients: AttentionClient[];
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

function getAttentionHref(client: AttentionClient): string {
  if (client.reason === 'no_program') {
    return `/clients/${client.clientId}/programs`;
  }
  return `/clients/${client.clientId}`;
}

export default function AttentionBanner({ clients }: AttentionBannerProps) {
  if (clients.length === 0) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 ring-1 ring-amber-500/10">
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-500/10 blur-2xl" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 ring-1 ring-amber-500/25 mt-0.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {clients.length === 1
              ? '1 asiakas vaatii huomiota'
              : `${clients.length} asiakasta vaatii huomiota`}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {clients.map((client) => {
              const config = reasonConfig[client.reason];
              return (
                <Link
                  key={`${client.clientId}-${client.reason}`}
                  href={getAttentionHref(client)}
                  className="group inline-flex items-center gap-1.5 text-xs transition-colors hover:text-foreground"
                >
                  <span className={cn('inline-block h-1.5 w-1.5 rounded-full shrink-0', config.dot)} />
                  <span className="font-medium text-foreground/90 group-hover:text-primary transition-colors">
                    {client.nickname}
                  </span>
                  <span className={cn('text-[11px]', config.color)}>
                    {config.label.toLowerCase()}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
