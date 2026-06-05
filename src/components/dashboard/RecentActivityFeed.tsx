import { format, formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Activity, Flame, Dumbbell } from 'lucide-react';
import { SessionSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <CardTitle className="text-lg">Viimeisimmät Treenit</CardTitle>
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
                      <p className="text-sm font-medium text-foreground truncate">
                        {session.workoutName || 'Nimetön treeni'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        {format(new Date(session.date), 'd.M.yyyy')}
                        <span>•</span>
                        {Math.floor(session.duration / 60)} min
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 gap-1">
                    <div className="text-sm font-medium">
                      {session.totalVolume} kg
                    </div>
                    {session.rpeAverage && (
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
