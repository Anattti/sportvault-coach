import Link from 'next/link';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { AlertTriangle, ArrowRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { ClientOverview } from '@/types';
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

export default function ClientSummaryTable({ clients }: ClientSummaryTableProps) {
  if (clients.length === 0) return null;

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
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="pl-4">Asiakas</TableHead>
              <TableHead>Viimeisin treeni</TableHead>
              <TableHead className="text-right">Treenit / vk</TableHead>
              <TableHead className="text-right">Suunniteltu</TableHead>
              <TableHead className="text-right">Volyymi / vk</TableHead>
              <TableHead className="text-right">Kesk. RPE</TableHead>
              <TableHead className="text-right">e1RM</TableHead>
              <TableHead className="text-right">Ohjelma</TableHead>
              <TableHead className="pr-4 text-right">Tila</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.clientId} className="border-border/40">
                <TableCell className="pl-4">
                  <Link
                    href={`/clients/${client.clientId}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {client.nickname}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {client.lastSessionDate
                    ? format(new Date(client.lastSessionDate), 'd.M.yyyy', { locale: fi })
                    : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <span className={cn(!client.trainedThisWeek && 'text-amber-400')}>
                    {client.totalSessionsThisWeek}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ComplianceCell client={client} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="tabular-nums">
                      {client.totalVolumeThisWeek.toLocaleString('fi-FI')} kg
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
                  <E1RMCell client={client} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">
                  {client.cycleWeek != null && client.cycleWeeks != null
                    ? `Vk ${client.cycleWeek}/${client.cycleWeeks}`
                    : client.activeProgramName ?? client.programName ?? '—'}
                  {client.programStuck && (
                    <AlertTriangle className="ml-1 inline h-3 w-3 text-purple-400" aria-label="Ohjelma jumissa" />
                  )}
                </TableCell>
                <TableCell className="pr-4 text-right">
                  <StatusBadge status={client.status} trained={client.trainedThisWeek} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function E1RMCell({ client }: { client: ClientOverview }) {
  if (!client.topExerciseName || client.topExerciseE1RM == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const TrendIcon =
    client.topExerciseTrend === 'up'
      ? TrendingUp
      : client.topExerciseTrend === 'down'
        ? TrendingDown
        : Minus;

  const trendColor =
    client.topExerciseTrend === 'up'
      ? 'text-primary'
      : client.topExerciseTrend === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <div className="flex flex-col items-end gap-0.5 max-w-[120px] ml-auto">
      <span className="truncate text-[10px] text-muted-foreground w-full text-right">
        {client.topExerciseName}
      </span>
      <span className={cn('inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums', trendColor)}>
        <TrendIcon className="h-3.5 w-3.5 shrink-0" />
        {client.topExerciseE1RM} kg
      </span>
    </div>
  );
}

function ComplianceCell({ client }: { client: ClientOverview }) {
  if (client.plannedSessionsThisWeek == null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const done = client.totalSessionsThisWeek;
  const planned = client.plannedSessionsThisWeek;
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
