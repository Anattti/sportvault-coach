'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { AlertTriangle, ArrowRight, ArrowUpDown, TrendingDown, TrendingUp } from 'lucide-react';
import { ClientOverview } from '@/types';
import CycleWeekIndicator from '@/components/programs/CycleWeekIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ClientSummaryTableProps {
  clients: ClientOverview[];
}

type SortKey = 'nickname' | 'lastSession' | 'sessions' | 'volume' | 'rpe' | 'status';
type SortDir = 'asc' | 'desc';

function getSortValue(client: ClientOverview, key: SortKey): number | string {
  switch (key) {
    case 'nickname':
      return client.nickname.toLowerCase();
    case 'lastSession':
      return client.lastSessionDate ?? '0000-00-00';
    case 'sessions':
      return client.totalSessionsThisWeek;
    case 'volume':
      return client.totalVolumeThisWeek;
    case 'rpe':
      return client.avgRpe ?? -1;
    case 'status':
      // inactive first when desc, active first when asc
      return client.trainedThisWeek ? 1 : 0;
    default:
      return 0;
  }
}

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return '—';
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fi });
  } catch {
    return '—';
  }
}

function getRowHighlight(client: ClientOverview): string {
  if (client.rpeElevated) return 'bg-red-500/[0.04] hover:bg-red-500/[0.07]';
  if (client.status === 'inactive') return 'bg-amber-500/[0.04] hover:bg-amber-500/[0.07]';
  if (!client.trainedThisWeek) return 'bg-amber-500/[0.02] hover:bg-amber-500/[0.04]';
  return 'hover:bg-white/[0.02]';
}

export default function ClientSummaryTable({ clients }: ClientSummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('lastSession');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    const copy = [...clients];
    copy.sort((a, b) => {
      const va = getSortValue(a, sortKey);
      const vb = getSortValue(b, sortKey);
      let cmp = 0;
      if (typeof va === 'string' && typeof vb === 'string') {
        cmp = va.localeCompare(vb, 'fi');
      } else {
        cmp = (va as number) - (vb as number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [clients, sortKey, sortDir]);

  if (clients.length === 0) return null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'nickname' ? 'asc' : 'desc');
    }
  };

  return (
    <Card className="bg-card/50 border-border ring-1 ring-white/5">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base font-semibold">Asiakkaiden yhteenveto</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-primary"
          render={<Link href="/clients" />}
          nativeButton={false}
        >
          Hallitse asiakkaita
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {/* Mobile sort controls */}
        <div className="md:hidden flex flex-wrap gap-1.5 px-4 pb-3">
          {(
            [
              { key: 'nickname' as SortKey, label: 'Nimi' },
              { key: 'lastSession' as SortKey, label: 'Viimeisin' },
              { key: 'sessions' as SortKey, label: 'Treenit' },
              { key: 'volume' as SortKey, label: 'Volyymi' },
              { key: 'status' as SortKey, label: 'Tila' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSort(key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors min-h-[44px]',
                sortKey === key
                  ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                  : 'bg-white/5 text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
              {sortKey === key && (
                <ArrowUpDown className="h-3 w-3 shrink-0" />
              )}
            </button>
          ))}
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-border/40 px-4">
          {sorted.map((client) => (
            <MobileClientCard key={client.clientId} client={client} />
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <SortableHead
                label="Asiakas"
                sortKey="nickname"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
                className="pl-4"
              />
              <SortableHead
                label="Viimeisin treeni"
                sortKey="lastSession"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
              />
              <SortableHead
                label="Treenit / vk"
                sortKey="sessions"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
                className="text-right"
              />
              <SortableHead
                label="Volyymi / vk"
                sortKey="volume"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
                className="text-right"
              />
              <SortableHead
                label="Kesk. RPE"
                sortKey="rpe"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
                className="text-right"
              />
              <TableHead className="text-right">Ohjelma</TableHead>
              <SortableHead
                label="Tila"
                sortKey="status"
                currentKey={sortKey}
                currentDir={sortDir}
                onSort={handleSort}
                className="pr-4 text-right"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((client) => (
              <TableRow
                key={client.clientId}
                className={cn('border-border/40 transition-colors', getRowHighlight(client))}
              >
                <TableCell className="pl-4">
                  <Link
                    href={`/clients/${client.clientId}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {client.nickname}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatRelativeDate(client.lastSessionDate)}
                </TableCell>
                <TableCell className="text-right">
                  <ComplianceCell client={client} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="tabular-nums">
                      {client.totalVolumeThisWeek > 0
                        ? `${client.totalVolumeThisWeek.toLocaleString('fi-FI')} kg`
                        : '—'}
                    </span>
                    {client.volumeChangePercent != null && (
                      <VolumeChange value={client.volumeChangePercent} />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span className="inline-flex items-center justify-end gap-1">
                    {client.avgRpe != null ? client.avgRpe.toFixed(1) : '—'}
                    {client.rpeElevated && (
                      <span title="Korkea RPE">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ProgramCell client={client} />
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <StatusBadge status={client.status} trained={client.trainedThisWeek} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function getMobileCardHighlight(client: ClientOverview): string {
  if (client.rpeElevated) return 'bg-red-500/[0.04]';
  if (client.status === 'inactive') return 'bg-amber-500/[0.04]';
  if (!client.trainedThisWeek) return 'bg-amber-500/[0.02]';
  return '';
}

function MobileClientCard({ client }: { client: ClientOverview }) {
  return (
    <Link
      href={`/clients/${client.clientId}`}
      className={cn(
        'flex flex-col gap-2 py-3 transition-colors active:bg-white/[0.03]',
        getMobileCardHighlight(client),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-foreground">{client.nickname}</span>
        <StatusBadge status={client.status} trained={client.trainedThisWeek} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Viimeisin treeni</span>
          <p className="text-muted-foreground">{formatRelativeDate(client.lastSessionDate)}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Treenit / vk</span>
          <div className="mt-0.5">
            <ComplianceCell client={client} />
          </div>
        </div>
        <div className="col-span-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Volyymi / vk</span>
          <div className="flex items-center gap-2">
            <span className="tabular-nums">
              {client.totalVolumeThisWeek > 0
                ? `${client.totalVolumeThisWeek.toLocaleString('fi-FI')} kg`
                : '—'}
            </span>
            {client.volumeChangePercent != null && (
              <VolumeChange value={client.volumeChangePercent} />
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SortableHead({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = sortKey === currentKey;

  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium transition-colors -ml-1 px-2 py-1.5 rounded hover:text-foreground min-h-[44px] md:min-h-0 md:px-1 md:py-0.5',
          isActive ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {label}
        <ArrowUpDown
          className={cn(
            'h-3 w-3 shrink-0 transition-opacity',
            isActive ? 'opacity-100' : 'opacity-30',
          )}
        />
        {isActive && (
          <span className="sr-only">
            {currentDir === 'asc' ? 'nouseva' : 'laskeva'}
          </span>
        )}
      </button>
    </TableHead>
  );
}

function ProgramCell({ client }: { client: ClientOverview }) {
  if (
    client.hasCycle &&
    client.cycleWeek != null &&
    client.cycleWeeks != null
  ) {
    return (
      <div className="ml-auto flex flex-col items-end gap-1">
        <CycleWeekIndicator
          currentWeek={client.cycleWeek}
          totalWeeks={client.cycleWeeks}
          programmedDeloads={client.programmedDeloads}
          programStuck={client.programStuck}
          variant="compact"
          align="right"
        />
        {(client.activeProgramName ?? client.programName) && (
          <p
            className="max-w-[140px] truncate text-[10px] text-muted-foreground"
            title={client.activeProgramName ?? client.programName ?? undefined}
          >
            {client.activeProgramName ?? client.programName}
          </p>
        )}
      </div>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">
      {client.activeProgramName ?? client.programName ?? '—'}
      {client.programStuck && (
        <AlertTriangle className="ml-1 inline h-3 w-3 text-purple-400" aria-label="Ohjelma jumissa" />
      )}
    </span>
  );
}

function ComplianceCell({ client }: { client: ClientOverview }) {
  const done = client.totalSessionsThisWeek;
  const planned = client.plannedSessionsThisWeek;

  if (planned == null) {
    return (
      <span className={cn('tabular-nums text-sm', !client.trainedThisWeek && 'text-amber-400')}>
        {done}
      </span>
    );
  }

  const behind = done < planned;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <span
        className={cn(
          'tabular-nums text-sm font-medium',
          behind ? 'text-amber-400' : 'text-primary',
        )}
      >
        {done}/{planned}
      </span>
      {client.compliancePercent != null && (
        <span className="text-[10px] text-muted-foreground">
          {client.compliancePercent} %
        </span>
      )}
    </div>
  );
}

function VolumeChange({ value }: { value: number }) {
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : null;
  const color =
    value > 0 ? 'text-primary' : value < 0 ? 'text-muted-foreground' : 'text-muted-foreground';

  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium', color)}>
      {Icon && <Icon className="h-3 w-3" />}
      {value > 0 ? '+' : ''}
      {value} %
    </span>
  );
}

function StatusBadge({
  status,
  trained,
}: {
  status: ClientOverview['status'];
  trained: boolean;
}) {
  if (status === 'inactive') {
    return (
      <Badge
        variant="outline"
        className="text-[10px] font-medium border-amber-500/30 bg-amber-500/10 text-amber-400"
      >
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
        Passiivinen
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-medium',
        trained
          ? 'border-primary/30 bg-primary/10 text-primary'
          : 'border-muted-foreground/30 bg-muted text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'mr-1.5 inline-block h-1.5 w-1.5 rounded-full',
          trained ? 'bg-primary' : 'bg-muted-foreground',
        )}
      />
      {trained ? 'Treenasi vk' : 'Ei treeniä vk'}
    </Badge>
  );
}
