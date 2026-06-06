import { AdherenceSummary } from '@/types';
import { ClipboardCheck, RefreshCw, Shuffle } from 'lucide-react';

interface AdherenceSummaryCardProps {
  adherence: AdherenceSummary;
}

function Metric({
  label,
  value,
  suffix = '',
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-4 py-3 ring-1 ring-white/8">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">
        {value != null ? `${value}${suffix}` : '—'}
      </p>
    </div>
  );
}

export default function AdherenceSummaryCard({ adherence }: AdherenceSummaryCardProps) {
  if (adherence.sessionsAnalyzed === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center text-muted-foreground">
        <ClipboardCheck className="mx-auto h-8 w-8 mb-2 opacity-30" />
        <p>Ei linkitettyjä ohjelmatreenejä vertailuun.</p>
        <p className="mt-1 text-sm">Suunniteltu vs tehty vaatii ohjelmaan linkitetyt sessiot.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="border-b border-white/8 px-5 py-4">
        <h3 className="text-base font-semibold">Ohjelman toteutus</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {adherence.sessionsAnalyzed} analysoitua sessiota — suunniteltu vs tehty
        </p>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Sarjojen completion" value={adherence.setCompletionPercent} suffix=" %" />
        <Metric
          label="Painopoikkeama"
          value={adherence.avgWeightDeviationPercent}
          suffix=" %"
        />
        <Metric label="Toistopoikkeama" value={adherence.avgRepsDeviation} suffix=" toistoa" />
        <Metric label="RPE vs tavoite" value={adherence.avgRpeDeviation} suffix="" />
        <Metric label="Vaihdetut liikkeet" value={adherence.swapPercent} suffix=" %" />
        <Metric label="Ad hoc -liikkeet" value={adherence.adHocPercent} suffix=" %" />
      </div>
      {(adherence.swapPercent != null && adherence.swapPercent > 20) ||
      (adherence.adHocPercent != null && adherence.adHocPercent > 20) ? (
        <div className="mx-5 mb-5 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-muted-foreground ring-1 ring-white/8">
          <Shuffle className="h-3.5 w-3.5 shrink-0" />
          Urheilija poikkeaa usein ohjelmasta — tarkista ohjelman sopivuus.
        </div>
      ) : (
        <div className="mx-5 mb-5 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground ring-1 ring-primary/15">
          <RefreshCw className="h-3.5 w-3.5 shrink-0 text-primary" />
          Ohjelmaa noudatetaan hyvin.
        </div>
      )}
    </div>
  );
}
