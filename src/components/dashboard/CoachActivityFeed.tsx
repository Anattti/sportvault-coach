import Link from 'next/link';
import { formatSessionDateTimeShortFi } from '@/lib/dates/fi';
import { Activity, ArrowRight, Dumbbell, Flame, Trophy } from 'lucide-react';
import SessionNoteIcons from '@/components/sessions/SessionNoteIcons';
import { CoachActivitySession, PersonalRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CoachActivityFeedProps {
  sessions: CoachActivitySession[];
  records?: PersonalRecord[];
  maxItems?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function CoachActivityFeed({
  sessions,
  records = [],
  maxItems = 5,
}: CoachActivityFeedProps) {
  // Build a set of sessionIds that have PRs for quick lookup
  const prBySession = new Map<string, PersonalRecord[]>();
  for (const pr of records) {
    const list = prBySession.get(pr.sessionId) ?? [];
    list.push(pr);
    prBySession.set(pr.sessionId, list);
  }

  const displaySessions = sessions.slice(0, maxItems);

  if (displaySessions.length === 0) {
    return (
      <Card className="bg-card/50 border-border ring-1 ring-white/5 h-full">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground min-h-[200px]">
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
          {displaySessions.map((session) => {
            const sessionPRs = prBySession.get(session.id);
            const hasPR = sessionPRs && sessionPRs.length > 0;

            return (
              <li key={session.id}>
                <Link
                  href={`/clients/${session.clientId}/sessions/${session.id}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]',
                    session.isNew && 'bg-primary/[0.04] hover:bg-primary/[0.06]',
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0 border border-white/10">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
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
                      {hasPR && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/25">
                          <Trophy className="h-2.5 w-2.5" />
                          PR
                        </span>
                      )}
                      <SessionNoteIcons
                        hasAthleteNote={session.hasAthleteNote}
                        hasCoachNote={session.hasCoachNote}
                      />
                    </div>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Activity className="h-3 w-3 shrink-0 opacity-60" />
                      {formatSessionDateTimeShortFi(new Date(session.date))}
                      <span className="opacity-40">·</span>
                      {Math.floor(session.duration / 60)} min
                      {session.workoutName && (
                        <>
                          <span className="opacity-40">·</span>
                          <span className="truncate">{session.workoutName}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {session.totalVolume.toLocaleString('fi-FI')} kg
                    </span>
                    {session.rpeAverage != null && (
                      <span className={cn(
                        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                        session.rpeAverage > 8.5
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-accent px-1.5 py-0.5 text-accent-foreground',
                      )}>
                        <Flame className="mr-0.5 h-3 w-3" />
                        RPE {session.rpeAverage.toFixed(1)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
