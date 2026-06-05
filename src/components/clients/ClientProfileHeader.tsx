'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Activity, Calendar, BarChart3, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CoachClient } from '@/types';
import ClientNotesDialog from '@/components/clients/ClientNotesDialog';
import ClientStatusMenu from '@/components/clients/ClientStatusMenu';

interface ClientProfileHeaderProps {
  client: CoachClient;
}

const statusLabels: Record<string, string> = {
  active: 'Aktiivinen',
  pending: 'Odottaa',
  paused: 'Tauolla',
  ended: 'Päättynyt',
};

export default function ClientProfileHeader({ client }: ClientProfileHeaderProps) {
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

  return (
    <div className="space-y-6 mb-8">
      <div>
        <Button variant="ghost" size="sm" render={<Link href="/clients" />} nativeButton={false} className="mb-4 -ml-2 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Takaisin asiakkaisiin
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 border-2 border-border">
            <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
              <Badge variant="outline">{statusLabels[client.status] || client.status}</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
              {profile?.experience_level && (
                <span className="capitalize">{profile.experience_level}</span>
              )}
              {profile?.age && (
                <span>{profile.age} vuotta</span>
              )}
              {profile?.weight && (
                <span>{profile.weight} kg</span>
              )}
              {profile?.height && (
                <span>{profile.height} cm</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ClientNotesDialog
            relationshipId={client.id}
            initialNotes={client.notes}
            trigger={<Button variant="outline" className="bg-background">Muokkaa muistiinpanoja</Button>}
          />
          <Button className="font-semibold" render={<Link href={`${baseUrl}/programs`} />} nativeButton={false}>
            Määritä ohjelma
          </Button>
          <ClientStatusMenu relationshipId={client.id} currentStatus={client.status as 'active' | 'paused' | 'ended'} />
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href ||
                             (tab.href !== baseUrl && pathname?.startsWith(tab.href));

            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                  'group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium whitespace-nowrap transition-colors'
                )}
              >
                <tab.icon
                  className={cn(
                    isActive ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground',
                    '-ml-0.5 mr-2 h-5 w-5'
                  )}
                  aria-hidden="true"
                />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
