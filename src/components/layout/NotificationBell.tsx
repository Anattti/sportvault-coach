'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Bell, CheckCheck, Dumbbell } from 'lucide-react';
import SessionNoteIcons from '@/components/sessions/SessionNoteIcons';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { WorkoutNotification } from '@/types';
import { markNotificationsSeen } from '@/app/actions/notifications';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface NotificationBellProps {
  notifications: WorkoutNotification[];
}

export default function NotificationBell({ notifications }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const count = notifications.length;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen && count > 0) {
      startTransition(async () => {
        await markNotificationsSeen();
        router.refresh();
      });
    }
  };

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markNotificationsSeen();
      setOpen(false);
      router.refresh();
    });
  };

  const handleNotificationClick = () => {
    startTransition(() => markNotificationsSeen());
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
          />
        }
      >
        <Bell className="h-[18px] w-[18px]" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-neon-sm">
            {count > 9 ? '9+' : count}
          </span>
        )}
        <span className="sr-only">
          {count > 0 ? `${count} uutta ilmoitusta` : 'Ilmoitukset'}
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 bg-[#121212] border-white/10 shadow-xl shadow-black/50"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Ilmoitukset</p>
            <p className="text-xs text-muted-foreground">
              {count > 0 ? `${count} uutta treeniä` : 'Ei uusia ilmoituksia'}
            </p>
          </div>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-primary"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Luettu
            </Button>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50">
                <Bell className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Kaikki ajan tasalla</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/clients/${n.clientId}/sessions/${n.id}`}
                    onClick={handleNotificationClick}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                      <Dumbbell className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {n.clientNickname}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {n.workoutName || 'Uusi treeni'}
                        {' · '}
                        {n.totalVolume.toLocaleString('fi-FI')} kg
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="text-[11px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                            locale: fi,
                          })}
                        </p>
                        <SessionNoteIcons
                          hasAthleteNote={n.hasAthleteNote}
                          hasCoachNote={n.hasCoachNote}
                          iconClassName="h-3 w-3"
                        />
                      </div>
                    </div>
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary shadow-neon-sm" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {count > 0 && (
          <div className="border-t border-white/8 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs text-muted-foreground hover:text-primary"
              render={<Link href="/" />}
              nativeButton={false}
              onClick={handleNotificationClick}
            >
              Näytä yleiskatsauksessa
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
