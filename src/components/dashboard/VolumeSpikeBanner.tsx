import { TrendingUp } from 'lucide-react';
import { VolumeSpikeAlert } from '@/types';

interface VolumeSpikeBannerProps {
  spike: VolumeSpikeAlert;
}

function formatVolume(kg: number): string {
  return `${kg.toLocaleString('fi-FI')} kg`;
}

export default function VolumeSpikeBanner({ spike }: VolumeSpikeBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 ring-1 ring-amber-500/15">
      <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-500/10 blur-2xl" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-500/25">
          <TrendingUp className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Volyymipiikki havaittu</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Kokonaiskuorma on noussut{' '}
            <span className="font-medium text-amber-400">+{spike.percentChange} %</span>{' '}
            edellisten viikkojen keskiarvoon verrattuna (
            {formatVolume(spike.currentVolume)} vs. keskiarvo{' '}
            {formatVolume(spike.avgVolume)}).
          </p>
          <p className="mt-1 text-xs text-muted-foreground/80">
            Tarkista asiakkaiden palautuminen ja harkitse deload-viikkoa tarvittaessa.
          </p>
        </div>
      </div>
    </div>
  );
}
