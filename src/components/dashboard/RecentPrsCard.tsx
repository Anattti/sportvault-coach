import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Medal, Trophy } from 'lucide-react';
import { PersonalRecord } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RecentPrsCardProps {
  records: PersonalRecord[];
}

export default function RecentPrsCard({ records }: RecentPrsCardProps) {
  if (records.length === 0) {
    return (
      <Card className="bg-card/50 border-border ring-1 ring-white/5 h-full">
        <CardContent className="flex flex-col items-center justify-center p-10 text-center text-muted-foreground min-h-[280px]">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 ring-1 ring-white/5">
            <Medal className="h-6 w-6 opacity-40" />
          </div>
          <p className="font-medium text-foreground/80">Ei uusia ennätyksiä</p>
          <p className="mt-1 max-w-xs text-sm">
            Henkilökohtaiset e1RM-ennätykset näkyvät täällä viimeisen 2 viikon ajalta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border ring-1 ring-white/5 h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Henkilökohtaiset ennätykset</CardTitle>
          <Badge
            variant="outline"
            className="h-5 min-w-5 justify-center px-1.5 text-[10px] border-primary/30 text-primary"
          >
            {records.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <ul className="divide-y divide-border/60">
          {records.map((record) => (
            <li key={`${record.sessionId}-${record.exerciseName}`}>
              <Link
                href={`/clients/${record.clientId}/sessions/${record.sessionId}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <Trophy className="h-4 w-4 text-primary" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {record.clientNickname}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {record.exerciseName}
                    {' · '}
                    e1RM {record.e1rm} kg
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs font-semibold text-primary">
                    +{record.improvementPercent} %
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(record.date), { addSuffix: true, locale: fi })}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
