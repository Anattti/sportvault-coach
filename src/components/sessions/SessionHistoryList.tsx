'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { isAfter, parseISO, subMonths } from 'date-fns';
import {
  formatMonthDayFi,
  formatMonthYearFi,
  formatWeekdayShortFi,
  formatDateFi,
  formatTimeFi,
  hasMeaningfulSessionTime,
} from '@/lib/dates/fi';
import {
  Activity,
  ChevronRight,
  Flame,
  History,
} from 'lucide-react';
import SessionNoteIcons from '@/components/sessions/SessionNoteIcons';
import { SessionSummary } from '@/types';
import { primaryActiveClassName } from '@/config/navigation';
import { getWorkoutTypeConfig } from '@/lib/workouts/types';
import SessionCycleBadge from '@/components/sessions/SessionCycleBadge';
import { cn } from '@/lib/utils';

interface SessionHistoryListProps {
  sessions: SessionSummary[];
  clientId: string;
  variant?: 'full' | 'compact';
  onSessionSelect?: (sessionId: string) => void;
  compactLimit?: number;
}

type FilterValue = 'all' | `year:${number}` | '3m' | '6m' | '12m';

const DEFAULT_COMPACT_LIMIT = 20;

function getAvailableYears(sessions: SessionSummary[]): number[] {
  const years = new Set<number>();
  for (const session of sessions) {
    if (!session.date) continue;
    years.add(parseISO(session.date).getFullYear());
  }
  return [...years].sort((a, b) => b - a);
}

function filterSessions(sessions: SessionSummary[], filter: FilterValue): SessionSummary[] {
  if (filter === 'all') return sessions;

  if (filter.startsWith('year:')) {
    const year = Number(filter.slice(5));
    return sessions.filter((s) => parseISO(s.date).getFullYear() === year);
  }

  const months = filter === '3m' ? 3 : filter === '6m' ? 6 : 12;
  const cutoff = subMonths(new Date(), months);
  return sessions.filter((s) => isAfter(parseISO(s.date), cutoff));
}

function groupByMonth(sessions: SessionSummary[]) {
  const groups = new Map<string, { label: string; sessions: SessionSummary[] }>();

  for (const session of sessions) {
    const date = parseISO(session.date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!groups.has(key)) {
      groups.set(key, { label: formatMonthYearFi(date), sessions: [] });
    }

    groups.get(key)!.sessions.push(session);
  }

  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, group]) => group);
}

function buildFilterOptions(years: number[]): Array<{ value: FilterValue; label: string }> {
  if (years.length >= 2) {
    return [
      { value: 'all', label: 'Kaikki' },
      ...years.map((year) => ({ value: `year:${year}` as FilterValue, label: String(year) })),
    ];
  }

  return [
    { value: 'all', label: 'Kaikki' },
    { value: '3m', label: '3 kk' },
    { value: '6m', label: '6 kk' },
    { value: '12m', label: '12 kk' },
  ];
}

function CompactSessionRow({
  session,
  clientId,
  onSessionSelect,
}: {
  session: SessionSummary;
  clientId: string;
  onSessionSelect?: (sessionId: string) => void;
}) {
  const date = parseISO(session.date);
  const interactive = Boolean(onSessionSelect);

  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <div className="flex w-10 shrink-0 flex-col items-center rounded-lg bg-white/[0.04] py-1 ring-1 ring-white/8">
          <span className="text-[9px] font-semibold uppercase text-muted-foreground">
            {formatWeekdayShortFi(date)}
          </span>
          <span className="text-sm font-bold tabular-nums leading-none">{date.getDate()}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium text-foreground">
              {session.workoutName || 'Nimetön treeni'}
            </p>
            <SessionCycleBadge
              cycleWeek={session.cycleWeek}
              cycleWeeks={session.cycleWeeks}
              className="text-[9px]"
            />
            <SessionNoteIcons
              hasAthleteNote={session.hasAthleteNote}
              hasCoachNote={session.hasCoachNote}
              className="gap-0.5"
            />
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatDateFi(date)}
            {hasMeaningfulSessionTime(date) && (
              <span> · klo {formatTimeFi(date)}</span>
            )}
            <span> · {Math.floor(session.duration / 60)} min</span>
            {session.rpeAverage != null && (
              <span> · RPE {session.rpeAverage.toFixed(1)}</span>
            )}
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-semibold tabular-nums">
          {session.totalVolume.toLocaleString('fi-FI')} kg
        </p>
      </div>
    </>
  );

  if (interactive) {
    return (
      <button
        type="button"
        onClick={() => onSessionSelect?.(session.id)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
      >
        {content}
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="relative flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-white/[0.03] group">
      <Link
        href={`/clients/${clientId}/sessions/${session.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Avaa treeni ${session.workoutName ?? 'Nimetön treeni'}`}
      />
      <div className="relative z-10 flex w-full items-center gap-2 pointer-events-none">
        {content}
      </div>
    </div>
  );
}

export default function SessionHistoryList({
  sessions,
  clientId,
  variant = 'full',
  onSessionSelect,
  compactLimit = DEFAULT_COMPACT_LIMIT,
}: SessionHistoryListProps) {
  const isCompact = variant === 'compact';
  const years = useMemo(() => getAvailableYears(sessions), [sessions]);
  const filterOptions = useMemo(() => buildFilterOptions(years), [years]);
  const [filter, setFilter] = useState<FilterValue>('all');
  const [showAllCompact, setShowAllCompact] = useState(false);

  const filteredSessions = useMemo(
    () => filterSessions(sessions, filter),
    [sessions, filter],
  );

  const compactSessions = useMemo(() => {
    if (!isCompact || showAllCompact) return filteredSessions;
    return filteredSessions.slice(0, compactLimit);
  }, [filteredSessions, isCompact, showAllCompact, compactLimit]);

  const groupedSessions = useMemo(
    () => (isCompact ? [] : groupByMonth(filteredSessions)),
    [filteredSessions, isCompact],
  );

  if (sessions.length === 0) {
    return (
      <div
        className={cn(
          'text-center text-muted-foreground',
          isCompact ? 'px-2 py-6 text-sm' : 'glass-panel rounded-2xl p-12',
        )}
      >
        {!isCompact && <Activity className="mx-auto h-8 w-8 mb-3 opacity-30" />}
        <p>Ei treenihistoriaa vielä.</p>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="space-y-2">
        <p className="px-1 text-xs text-muted-foreground">
          {filteredSessions.length}{' '}
          {filteredSessions.length === 1 ? 'treeni' : 'treeniä'}
        </p>
        <div className="divide-y divide-white/5 overflow-hidden rounded-xl ring-1 ring-white/8">
          {compactSessions.map((session) => (
            <CompactSessionRow
              key={session.id}
              session={session}
              clientId={clientId}
              onSessionSelect={onSessionSelect}
            />
          ))}
        </div>
        {!showAllCompact && filteredSessions.length > compactLimit && (
          <button
            type="button"
            onClick={() => setShowAllCompact(true)}
            className="w-full py-2 text-xs font-medium text-primary hover:underline"
          >
            Näytä kaikki ({filteredSessions.length})
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredSessions.length}{' '}
          {filteredSessions.length === 1 ? 'treeni' : 'treeniä'}
          {filter !== 'all' && ` valitulla jaksolla`}
        </p>
        <div className="flex flex-wrap gap-1.5 rounded-lg bg-white/5 p-1 ring-1 ring-white/8">
          {filterOptions.map((option) => {
            const isActive = filter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
                  isActive
                    ? primaryActiveClassName
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {groupedSessions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-muted-foreground">
          <p>Ei treenejä valitulla jaksolla.</p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="mt-3 text-sm font-medium text-primary hover:underline"
          >
            Näytä kaikki
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSessions.map((group) => (
            <section key={group.label}>
              <h3 className="mb-2 px-1 text-sm font-semibold text-primary">
                {group.label}
              </h3>
              <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-white/5">
                {group.sessions.map((session) => (
                  <div
                    key={session.id}
                    className="relative flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.03] group"
                  >
                    <Link
                      href={`/clients/${clientId}/sessions/${session.id}`}
                      className="absolute inset-0 z-0 rounded-none"
                      aria-label={`Avaa treeni ${session.workoutName ?? 'Nimetön treeni'} ${formatDateFi(parseISO(session.date))}`}
                    />

                    <div className="relative z-10 flex w-[3.25rem] shrink-0 flex-col items-center rounded-xl bg-white/[0.04] py-2 ring-1 ring-white/8 pointer-events-none">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {formatWeekdayShortFi(parseISO(session.date))}
                      </span>
                      <span className="text-xl font-bold tabular-nums leading-none text-foreground">
                        {parseISO(session.date).getDate()}
                      </span>
                      <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                        {formatMonthDayFi(parseISO(session.date))}
                      </span>
                    </div>

                    <div className="relative z-10 min-w-0 flex-1 pointer-events-none">
                      <div className="flex items-center gap-2">
                        {session.workoutId ? (
                          <Link
                            href={`/clients/${clientId}/sessions/workout/${session.workoutId}`}
                            className="pointer-events-auto inline-flex min-w-0 max-w-full items-center gap-1.5 truncate font-medium text-foreground transition-colors hover:text-primary hover:underline"
                            title="Näytä treenin koko historia"
                          >
                            <span className="truncate">
                              {session.workoutName || 'Nimetön treeni'}
                            </span>
                            <History className="h-3.5 w-3.5 shrink-0 opacity-60" />
                          </Link>
                        ) : (
                          <p className="truncate font-medium text-foreground">
                            {session.workoutName || 'Nimetön treeni'}
                          </p>
                        )}
                        <SessionCycleBadge
                          cycleWeek={session.cycleWeek}
                          cycleWeeks={session.cycleWeeks}
                        />
                        <SessionNoteIcons
                          hasAthleteNote={session.hasAthleteNote}
                          hasCoachNote={session.hasCoachNote}
                        />
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {hasMeaningfulSessionTime(parseISO(session.date)) && (
                          <>
                            <span className="tabular-nums">
                              klo {formatTimeFi(parseISO(session.date))}
                            </span>
                            <span className="opacity-40">·</span>
                          </>
                        )}
                        <span>{Math.floor(session.duration / 60)} min</span>
                        {session.exerciseCount > 0 && (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{session.exerciseCount} liikettä</span>
                          </>
                        )}
                        {session.workoutType && (
                          <>
                            <span className="opacity-40">·</span>
                            <span>{getWorkoutTypeConfig(session.workoutType).label}</span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="relative z-10 flex shrink-0 items-center gap-3 pointer-events-none">
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {session.totalVolume.toLocaleString('fi-FI')} kg
                        </p>
                        {session.rpeAverage != null && (
                          <span className="inline-flex items-center text-[10px] font-medium text-muted-foreground">
                            <Flame className="mr-0.5 h-3 w-3 text-accent" />
                            RPE {session.rpeAverage.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-100 md:opacity-0 transition-opacity md:group-hover:opacity-100" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
