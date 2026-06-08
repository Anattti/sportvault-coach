'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { isAfter, parseISO, subMonths } from 'date-fns';
import {
  formatMonthDayFi,
  formatMonthYearFi,
  formatWeekdayShortFi,
} from '@/lib/dates/fi';
import {
  Activity,
  ChevronRight,
  Flame,
  StickyNote,
} from 'lucide-react';
import { SessionSummary } from '@/types';
import { primaryActiveClassName } from '@/config/navigation';
import { getWorkoutTypeConfig } from '@/lib/workouts/types';
import { cn } from '@/lib/utils';

interface SessionHistoryListProps {
  sessions: SessionSummary[];
  clientId: string;
}

type FilterValue = 'all' | `year:${number}` | '3m' | '6m' | '12m';

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

export default function SessionHistoryList({ sessions, clientId }: SessionHistoryListProps) {
  const years = useMemo(() => getAvailableYears(sessions), [sessions]);
  const filterOptions = useMemo(() => buildFilterOptions(years), [years]);
  const [filter, setFilter] = useState<FilterValue>('all');

  const filteredSessions = useMemo(
    () => filterSessions(sessions, filter),
    [sessions, filter],
  );

  const groupedSessions = useMemo(
    () => groupByMonth(filteredSessions),
    [filteredSessions],
  );

  if (sessions.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground">
        <Activity className="mx-auto h-8 w-8 mb-3 opacity-30" />
        <p>Ei treenihistoriaa vielä.</p>
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
                  <Link
                    key={session.id}
                    href={`/clients/${clientId}/sessions/${session.id}`}
                    className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.03] group"
                  >
                    <div className="flex w-[3.25rem] shrink-0 flex-col items-center rounded-xl bg-white/[0.04] py-2 ring-1 ring-white/8">
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

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">
                          {session.workoutName || 'Nimetön treeni'}
                        </p>
                        {session.hasCoachNote && (
                          <StickyNote className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Valmentajan muistiinpano" />
                        )}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
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

                    <div className="flex shrink-0 items-center gap-3">
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
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
