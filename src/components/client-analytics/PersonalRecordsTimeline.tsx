import Link from 'next/link';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Trophy } from 'lucide-react';
import SessionNoteIcons from '@/components/sessions/SessionNoteIcons';
import { ClientPersonalRecord } from '@/types';

interface PersonalRecordsTimelineProps {
  records: ClientPersonalRecord[];
  clientId: string;
  limit?: number;
}

export default function PersonalRecordsTimeline({
  records,
  clientId,
  limit,
}: PersonalRecordsTimelineProps) {
  const displayRecords = limit ? records.slice(0, limit) : records;

  if (displayRecords.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground">
        <Trophy className="mx-auto h-8 w-8 mb-2 opacity-30" />
        <p>Ei vielä ennätyksiä valitulla jaksolla.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="border-b border-white/8 px-5 py-4">
        <h3 className="text-base font-semibold">Ennätykset</h3>
        <p className="text-xs text-muted-foreground mt-0.5">e1RM-parannukset aikajärjestyksessä</p>
      </div>
      <ul className="divide-y divide-white/5">
        {displayRecords.map((pr, index) => (
          <li key={`${pr.sessionId}-${pr.exerciseName}-${index}`}>
            <Link
              href={`/clients/${clientId}/sessions/${pr.sessionId}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">{pr.exerciseName}</p>
                  <SessionNoteIcons
                    hasAthleteNote={pr.hasAthleteNote}
                    hasCoachNote={pr.hasCoachNote}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(pr.date), 'd.M.yyyy', { locale: fi })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold tabular-nums text-primary">{pr.e1rm} kg</p>
                <p className="text-xs text-muted-foreground">
                  +{pr.improvementPercent} % ({pr.previousBest} kg)
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
