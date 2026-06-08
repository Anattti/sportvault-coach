import Link from 'next/link';
import { ClipboardCheck, Shuffle } from 'lucide-react';
import { AdherenceSummary } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdherenceSummaryCompactProps {
  adherence: AdherenceSummary;
  clientId: string;
}

export default function AdherenceSummaryCompact({
  adherence,
  clientId,
}: AdherenceSummaryCompactProps) {
  if (adherence.sessionsAnalyzed === 0) {
    return (
      <Card className="bg-card border-border h-full">
        <CardHeader>
          <CardTitle className="text-lg">Ohjelman toteutus</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <ClipboardCheck className="mb-2 h-8 w-8 opacity-20" />
          <p className="text-sm">Ei linkitettyjä ohjelmatreenejä vertailuun.</p>
        </CardContent>
      </Card>
    );
  }

  const deviatesOften =
    (adherence.swapPercent != null && adherence.swapPercent > 20) ||
    (adherence.adHocPercent != null && adherence.adHocPercent > 20);

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Ohjelman toteutus</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {adherence.sessionsAnalyzed} analysoitua sessiota
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
          render={<Link href={`/clients/${clientId}/analytics`} />}
          nativeButton={false}
        >
          Tarkemmin
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Sarjojen completion
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {adherence.setCompletionPercent != null
              ? `${adherence.setCompletionPercent} %`
              : '—'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Painopoikkeama"
            value={
              adherence.avgWeightDeviationPercent != null
                ? `${adherence.avgWeightDeviationPercent} %`
                : '—'
            }
          />
          <Metric
            label="RPE vs tavoite"
            value={
              adherence.avgRpeDeviation != null
                ? String(adherence.avgRpeDeviation)
                : '—'
            }
          />
          <Metric
            label="Vaihdetut liikkeet"
            value={
              adherence.swapPercent != null ? `${adherence.swapPercent} %` : '—'
            }
          />
          <Metric
            label="Ad hoc -liikkeet"
            value={
              adherence.adHocPercent != null ? `${adherence.adHocPercent} %` : '—'
            }
          />
        </div>

        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2 text-xs ring-1',
            deviatesOften
              ? 'bg-white/[0.03] text-muted-foreground ring-white/8'
              : 'bg-primary/5 text-muted-foreground ring-primary/15',
          )}
        >
          {deviatesOften ? (
            <>
              <Shuffle className="h-3.5 w-3.5 shrink-0" />
              Urheilija poikkeaa usein ohjelmasta — tarkista sopivuus.
            </>
          ) : (
            <>
              <ClipboardCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              Ohjelmaa noudatetaan hyvin.
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
