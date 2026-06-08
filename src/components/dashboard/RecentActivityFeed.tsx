import { format } from 'date-fns';
import { Activity, Flame, Dumbbell, StickyNote } from 'lucide-react';
import { SessionSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getWorkoutTypeConfig } from '@/lib/workouts/types';
import SessionCycleBadge from '@/components/sessions/SessionCycleBadge';
import Link from 'next/link';

interface RecentActivityFeedProps {
  sessions: SessionSummary[];
  clientId: string;
}

export default function RecentActivityFeed({ sessions, clientId }: RecentActivityFeedProps) {
  if (sessions.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <Dumbbell className="h-8 w-8 mb-2 opacity-20" />
          <p>Ei aiempia treenejä</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Viimeisimmät treenit</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={`/clients/${clientId}/sessions/${session.id}`}
                className="block hover:bg-muted/50 transition-colors p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 gap-3">
                    <div className="bg-primary/10 p-2 rounded-full shrink-0">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.workoutName || 'Nimetön treeni'}
                        </p>
                        <SessionCycleBadge
                          cycleWeek={session.cycleWeek}
                          cycleWeeks={session.cycleWeeks}
                        />
                        {session.hasCoachNote && (
                          <StickyNote
                            className="h-3.5 w-3.5 shrink-0 text-primary"
                            aria-label="Valmentajan muistiinpano"
                          />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 flex-wrap">
                        <span>{format(new Date(session.date), 'd.M.yyyy')}</span>
                        <span>•</span>
                        <span>{Math.floor(session.duration / 60)} min</span>
                        {session.workoutType && (
                          <>
                            <span>•</span>
                            <span>{getWorkoutTypeConfig(session.workoutType).label}</span>
                          </>
                        )}
                        {session.feeling != null && (
                          <>
                            <span>•</span>
                            <span>Olo {session.feeling}/5</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <div className="text-sm font-medium">
                      {session.totalVolume.toLocaleString('fi-FI')} kg
                    </div>
                    {session.rpeAverage != null && (
                      <div className="flex items-center text-xs text-muted-foreground bg-accent/10 px-1.5 rounded">
                        <Flame className="h-3 w-3 mr-1 text-accent" />
                        RPE {session.rpeAverage.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
