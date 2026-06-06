import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, ClipboardList, Flame, RotateCcw, TrendingUp } from 'lucide-react';
import { AttentionClient } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AttentionClientsListProps {
  clients: AttentionClient[];
}

const reasonConfig = {
  inactive: {
    label: 'Ei treeniä 7+ pv',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    iconClass: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  },
  no_sessions: {
    label: 'Ei treenihistoriaa',
    icon: AlertTriangle,
    badgeClass: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    iconClass: 'text-orange-400 bg-orange-500/10 ring-orange-500/20',
  },
  pending: {
    label: 'Odottaa hyväksyntää',
    icon: AlertTriangle,
    badgeClass: 'bg-muted text-muted-foreground border-border',
    iconClass: 'text-muted-foreground bg-muted ring-white/10',
  },
  high_rpe: {
    label: 'Korkea RPE',
    icon: Flame,
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    iconClass: 'text-red-400 bg-red-500/10 ring-red-500/20',
  },
  volume_spike: {
    label: 'Volyymipiikki',
    icon: TrendingUp,
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    iconClass: 'text-amber-400 bg-amber-500/10 ring-amber-500/20',
  },
  no_program: {
    label: 'Ei ohjelmaa',
    icon: ClipboardList,
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    iconClass: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
  },
  program_stuck: {
    label: 'Ohjelma jumissa',
    icon: RotateCcw,
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    iconClass: 'text-purple-400 bg-purple-500/10 ring-purple-500/20',
  },
} as const;

function getAttentionHref(client: AttentionClient): string {
  if (client.reason === 'no_program') {
    return `/clients/${client.clientId}/programs`;
  }
  return `/clients/${client.clientId}`;
}

function getDetailText(client: AttentionClient): string {
  if (client.detail) return client.detail;

  switch (client.reason) {
    case 'inactive':
      return client.lastSessionDate
        ? `Viimeisin treeni ${formatDistanceToNow(new Date(client.lastSessionDate), { addSuffix: true, locale: fi })}`
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
      return 'Sykliviikko ei etene';
    default:
      return '';
  }
}

export default function AttentionClientsList({ clients }: AttentionClientsListProps) {
  if (clients.length === 0) {
    return (
      <Card className="bg-card/50 border-border ring-1 ring-white/5 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Huomiota vaativat</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10 text-center min-h-[280px]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium text-foreground/90">Kaikki kunnossa</p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Ei passiivisia asiakkaita, korkeaa RPE:tä tai volyymipiikkejä.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border ring-1 ring-white/5 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Huomiota vaativat</CardTitle>
          <Badge variant="outline" className="h-5 min-w-5 justify-center px-1.5 text-[10px] border-amber-500/30 text-amber-400">
            {clients.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ul className="divide-y divide-border/60">
          {clients.map((client) => {
            const config = reasonConfig[client.reason];
            const Icon = config.icon;

            return (
              <li key={`${client.clientId}-${client.reason}`}>
                <Link
                  href={getAttentionHref(client)}
                  className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1',
                      config.iconClass,
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {client.nickname}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {getDetailText(client)}
                    </p>
                  </div>

                  <Badge variant="outline" className={cn('shrink-0 text-[10px]', config.badgeClass)}>
                    {config.label}
                  </Badge>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
