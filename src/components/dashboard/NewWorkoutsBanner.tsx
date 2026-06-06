'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Bell, Dumbbell, X } from 'lucide-react';
import { useState, useTransition } from 'react';
import { WorkoutNotification } from '@/types';
import { markNotificationsSeen } from '@/app/actions/notifications';
import { Button } from '@/components/ui/button';

interface NewWorkoutsBannerProps {
  notifications: WorkoutNotification[];
}

export default function NewWorkoutsBanner({ notifications }: NewWorkoutsBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [, startTransition] = useTransition();

  if (notifications.length === 0 || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    startTransition(() => markNotificationsSeen());
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.06] p-4 ring-1 ring-primary/15">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {notifications.length === 1
                ? '1 uusi treeni'
                : `${notifications.length} uutta treeniä`}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Viimeisin:{' '}
              <span className="text-foreground/80">
                {notifications[0].clientNickname}
              </span>
              {' · '}
              {formatDistanceToNow(new Date(notifications[0].createdAt), {
                addSuffix: true,
                locale: fi,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground font-medium shadow-neon-sm"
            render={
              <Link
                href={`/clients/${notifications[0].clientId}/sessions/${notifications[0].id}`}
              />
            }
            nativeButton={false}
            onClick={() => startTransition(() => markNotificationsSeen())}
          >
            <Dumbbell className="mr-1.5 h-3.5 w-3.5" />
            Näytä treeni
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleDismiss}
            title="Merkitse luetuiksi"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
