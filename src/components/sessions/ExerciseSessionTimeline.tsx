'use client';

import Link from 'next/link';
import { parseISO } from 'date-fns';
import { CheckCircle2, Trophy } from 'lucide-react';
import { formatCycleWeekLabel } from '@/lib/sessions/format';
import { formatSessionDateTimeFi } from '@/lib/dates/fi';
import { ExerciseSessionHistoryData } from '@/lib/sessions/exercise-history';
import SessionNoteIcons from '@/components/sessions/SessionNoteIcons';
import SessionCycleBadge from '@/components/sessions/SessionCycleBadge';
import RpeBadge from '@/components/sessions/RpeBadge';
import { cn } from '@/lib/utils';

interface ExerciseSessionTimelineProps {
  data: ExerciseSessionHistoryData;
  clientId: string;
  embedded?: boolean;
}

export default function ExerciseSessionTimeline({
  data,
  clientId,
  embedded = true,
}: ExerciseSessionTimelineProps) {
  if (data.sessions.length === 0) {
    return (
      <p className="px-1 text-xs text-muted-foreground">Ei suorituksia tälle liikkeelle.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="px-1">
        <p className="text-xs text-muted-foreground">
          {data.sessions.length}{' '}
          {data.sessions.length === 1 ? 'treeni' : 'treeniä'}
          {data.bestE1rm != null && (
            <span className="text-primary/80"> · Ennätys {data.bestE1rm} kg</span>
          )}
        </p>
      </div>

      {data.sessions.map((session) => {
        const cycleLabel = formatCycleWeekLabel(session.cycleWeek, session.cycleWeeks);
        const isBestSession =
          data.bestE1rm != null &&
          session.bestE1rm != null &&
          session.bestE1rm === data.bestE1rm;

        return (
          <section
            key={session.sessionId}
            className={cn(
              'overflow-hidden',
              embedded ? 'rounded-xl ring-1 ring-white/8' : 'glass-panel rounded-2xl',
            )}
          >
            <div className="border-b border-white/8 bg-white/[0.02] px-3 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/clients/${clientId}/sessions/${session.sessionId}`}
                  className="text-sm font-semibold text-foreground transition-colors hover:text-primary hover:underline"
                >
                  {formatSessionDateTimeFi(parseISO(session.date))}
                </Link>
                {session.workoutName && (
                  <span className="truncate text-xs text-muted-foreground">
                    {session.workoutName}
                  </span>
                )}
                {cycleLabel && (
                  <SessionCycleBadge
                    cycleWeek={session.cycleWeek}
                    cycleWeeks={session.cycleWeeks}
                    className="text-[9px]"
                  />
                )}
                <SessionNoteIcons
                  hasAthleteNote={session.hasAthleteNote}
                  hasCoachNote={session.hasCoachNote}
                />
                {isBestSession && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    <Trophy className="h-3 w-3" />
                    Ennätys
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-xs">
                <thead>
                  <tr className="border-b border-white/8 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Sarja</th>
                    <th className="px-2 py-2 font-medium">Paino</th>
                    <th className="px-2 py-2 font-medium">Toistot</th>
                    <th className="px-2 py-2 font-medium">RPE</th>
                    <th className="px-3 py-2 font-medium">e1RM</th>
                  </tr>
                </thead>
                <tbody>
                  {session.sets.map((set, index) => {
                    const isBestSet =
                      set.e1rm != null && data.bestE1rm != null && set.e1rm === data.bestE1rm;

                    return (
                      <tr
                        key={`${session.sessionId}-${index}`}
                        className={cn(
                          'border-b border-white/5',
                          isBestSet && 'bg-primary/[0.04]',
                        )}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.04] text-[10px] font-semibold tabular-nums ring-1 ring-white/8">
                              {set.displaySetIndex}
                            </span>
                            <CheckCircle2 className="h-3 w-3 text-primary/70" />
                          </div>
                        </td>
                        <td className="px-2 py-2 font-semibold tabular-nums">
                          {set.weightUsed != null ? `${set.weightUsed} kg` : '—'}
                        </td>
                        <td className="px-2 py-2 font-semibold tabular-nums">
                          {set.repsCompleted != null ? set.repsCompleted : '—'}
                        </td>
                        <td className="px-2 py-2">
                          {set.rpe != null ? <RpeBadge rpe={set.rpe} size="md" /> : '—'}
                        </td>
                        <td
                          className={cn(
                            'px-3 py-2 tabular-nums',
                            isBestSet ? 'font-semibold text-primary' : 'text-muted-foreground',
                          )}
                        >
                          {set.e1rm != null ? `${set.e1rm} kg` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
