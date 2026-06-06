import Link from 'next/link';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Activity, ArrowRight, Dumbbell, Flame } from 'lucide-react';
import { CoachActivitySession } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CoachActivityFeedProps {
  sessions: CoachActivitySession[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function CoachActivityFeed({ sessions }: CoachActivityFeedProps) {
  if (sessions.length === 0) {
    return (
      <Card className="bg-card/50 border-border ring-1 ring-white/5 h-full">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground min-h-[280px]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-white/5">
            <Dumbbell className="h-6 w-6 opacity-40" />
          </div>
          <p className="font-medium text-foreground/80">Ei treenejä vielä</p>
          <p className="mt-1 max-w-xs text-sm">
            Kun asiakkaasi suorittavat treenejä, ne näkyvät tässä reaaliaikaisesti.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border ring-1 ring-white/5 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Viimeisimmät treenit</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-primary"
          render={<Link href="/clients" />}
          nativeButton={false}
        >
          Kaikki asiakkaat
          <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ul className="divide-y divide-border/60">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/clients/${session.clientId}/sessions/${session.id}`}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]',
                  session.isNew && 'bg-primary/[0.04] hover:bg-primary/[0.06]',
                )}
              >
                <Avatar className="h-9 w-9 shrink-0 border border-white/10">
                  <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                    {getInitials(session.clientNickname)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {session.clientNickname}
                    </p>
                    {session.isNew && (
                      <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/25">
                        Uusi
                      </span>
                    )}
                    <span className="hidden sm:inline text-muted-foreground/40">·</span>
                    <p className="hidden sm:block truncate text-sm text-muted-foreground">
                      {session.workoutName || 'Nimetön treeni'}
                    </p>
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3 shrink-0 opacity-60" />
                    {format(new Date(session.date), 'EEE d.M.', { locale: fi })}
                    <span className="opacity-40">·</span>
                    {Math.floor(session.duration / 60)} min
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {session.totalVolume.toLocaleString('fi-FI')} kg
                  </span>
                  {session.rpeAverage != null && (
                    <span className="inline-flex items-center rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                      <Flame className="mr-0.5 h-3 w-3" />
                      RPE {session.rpeAverage.toFixed(1)}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
