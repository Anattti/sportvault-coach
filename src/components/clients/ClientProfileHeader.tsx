'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Activity,
  Calendar,
  BarChart3,
  ChevronLeft,
  Scale,
  Ruler,
  Cake,
  Dumbbell,
  FileText,
  CalendarPlus,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getClientTabIconClassName,
  getClientTabLinkClassName,
  isClientTabActive,
} from '@/config/navigation';
import CycleWeekIndicator from '@/components/programs/CycleWeekIndicator';
import { ProgramCycleStatus } from '@/lib/programs/cycle-status';
import { CoachClient } from '@/types';
import ClientNotesDialog from '@/components/clients/ClientNotesDialog';
import ClientStatusMenu from '@/components/clients/ClientStatusMenu';
import { cn } from '@/lib/utils';

interface ClientProfileHeaderProps {
  client: CoachClient;
  cycleStatus: ProgramCycleStatus;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  active: {
    label: 'Aktiivinen',
    className: 'border-primary/25 bg-primary/10 text-primary',
  },
  pending: {
    label: 'Odottaa',
    className: 'border-white/15 bg-white/5 text-muted-foreground',
  },
  paused: {
    label: 'Tauolla',
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
  },
  ended: {
    label: 'Päättynyt',
    className: 'border-white/10 bg-white/[0.03] text-white/35',
  },
};

const experienceLabels: Record<string, string> = {
  beginner: 'Aloittelija',
  intermediate: 'Keskitaso',
  advanced: 'Edistynyt',
};

function StatChip({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className="h-3 w-3 shrink-0 text-white/30" aria-hidden="true" />
      {children}
    </span>
  );
}

export default function ClientProfileHeader({ client, cycleStatus }: ClientProfileHeaderProps) {
  const pathname = usePathname();
  const baseUrl = `/clients/${client.client_id}`;

  const tabs = [
    { name: 'Yleiskatsaus', href: baseUrl, icon: User },
    { name: 'Treenit', href: `${baseUrl}/sessions`, icon: Activity },
    { name: 'Ohjelmat', href: `${baseUrl}/programs`, icon: Calendar },
    { name: 'Analytiikka', href: `${baseUrl}/analytics`, icon: BarChart3 },
  ];

  const profile = client.profile;
  const displayName = profile?.nickname || 'Nimetön urheilija';
  const status = statusConfig[client.status] ?? {
    label: client.status,
    className: 'border-border text-foreground',
  };

  const hasStats =
    profile?.experience_level ||
    profile?.age ||
    profile?.weight ||
    profile?.height;

  const hasCycle =
    cycleStatus.hasCycle &&
    cycleStatus.currentWeek != null &&
    cycleStatus.totalWeeks != null;

  const experienceLabel = profile?.experience_level
    ? experienceLabels[profile.experience_level] ?? profile.experience_level
    : null;

  const assignProgramButton = (
    <Button
      className="w-full font-semibold shadow-[0_0_12px_rgba(0,255,65,0.15)]"
      render={<Link href={`${baseUrl}/programs`} />}
      nativeButton={false}
    >
      <CalendarPlus className="h-4 w-4" />
      Määritä ohjelma
    </Button>
  );

  const notesButton = (
    <ClientNotesDialog
      relationshipId={client.id}
      initialNotes={client.notes}
      trigger={
        <Button variant="outline" className="w-full bg-background/60">
          <FileText className="h-4 w-4" />
          <span className="truncate">Muistiinpanot</span>
        </Button>
      }
    />
  );

  return (
    <header className="mb-6 md:mb-8">
      <Link
        href="/clients"
        className="group mb-4 inline-flex items-center gap-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft
          className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
          aria-hidden="true"
        />
        Takaisin asiakkaisiin
      </Link>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/40 ring-1 ring-white/5">
        <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="p-4 md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <Avatar className="h-16 w-16 shrink-0 border-2 border-primary/20 md:h-[4.5rem] md:w-[4.5rem]">
                <AvatarFallback className="bg-gradient-to-br from-white/10 to-white/[0.03] text-xl font-semibold text-foreground md:text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h1 className="text-2xl font-bold tracking-tight break-words md:text-3xl">
                    {displayName}
                  </h1>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 text-[11px] font-semibold uppercase tracking-wide', status.className)}
                  >
                    {status.label}
                  </Badge>
                </div>

                {hasStats && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {experienceLabel && (
                      <StatChip icon={Dumbbell}>{experienceLabel}</StatChip>
                    )}
                    {profile?.age && (
                      <StatChip icon={Cake}>{profile.age} v</StatChip>
                    )}
                    {profile?.weight && (
                      <StatChip icon={Scale}>{profile.weight} kg</StatChip>
                    )}
                    {profile?.height && (
                      <StatChip icon={Ruler}>{profile.height} cm</StatChip>
                    )}
                  </div>
                )}
              </div>
            </div>

            {hasCycle && (
              <div className="w-full shrink-0 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 sm:max-w-sm xl:w-72">
                <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Aktiivinen ohjelma
                </p>
                {cycleStatus.programName && (
                  <p className="mb-2.5 truncate text-sm font-medium text-foreground">
                    {cycleStatus.programName}
                  </p>
                )}
                <CycleWeekIndicator
                  currentWeek={cycleStatus.currentWeek!}
                  totalWeeks={cycleStatus.totalWeeks!}
                  programmedDeloads={cycleStatus.programmedDeloads}
                  programStuck={cycleStatus.programStuck}
                />
              </div>
            )}

            <div className="hidden shrink-0 flex-col gap-2 xl:flex xl:min-w-[11rem]">
              {assignProgramButton}
              {notesButton}
              <ClientStatusMenu
                relationshipId={client.id}
                currentStatus={client.status as 'active' | 'paused' | 'ended'}
                className="w-full"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2 xl:hidden">
            {assignProgramButton}
            <div className="grid grid-cols-2 gap-2">
              {notesButton}
              <ClientStatusMenu
                relationshipId={client.id}
                currentStatus={client.status as 'active' | 'paused' | 'ended'}
                compact
                className="w-full"
              />
            </div>
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-border/60 px-2 py-2 md:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Asiakkaan välilehdet"
        >
          {tabs.map((tab) => {
            const isActive = isClientTabActive(pathname, tab.href, baseUrl);

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(getClientTabLinkClassName(isActive), 'px-3.5 py-2')}
              >
                <tab.icon className={getClientTabIconClassName(isActive)} aria-hidden="true" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
