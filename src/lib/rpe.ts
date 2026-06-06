/**
 * RPE-värit yhdenmukaisina Sportvault-mobilen kanssa.
 * @see sportvault-mobile/src/features/workouts/sessionSummary/utils.ts (getRPEColor, getRPEBg)
 * @see sportvault-mobile/src/features/createWorkout/rpe.ts (getRpeInfo, RIR)
 */

export const RPE_NEON_GREEN = '#00FF41';

export interface RpeColorStyles {
  color: string;
  backgroundColor: string;
  rir: string;
}

export function formatRpe(rpe: number): string {
  return Number.isInteger(rpe) ? String(rpe) : rpe.toFixed(1);
}

/** Session summary -tyylinen 4-portainen värikoodaus (suoritetun treenin näkymä). */
export function getRpeColor(rpe: number | null): string {
  if (!rpe) return 'rgba(255, 255, 255, 0.5)';
  if (rpe >= 9) return '#EF4444';
  if (rpe >= 8) return '#F97316';
  if (rpe >= 7) return '#F59E0B';
  return RPE_NEON_GREEN;
}

export function getRpeBg(rpe: number | null): string {
  if (!rpe) return 'rgba(255, 255, 255, 0.05)';
  if (rpe >= 9) return 'rgba(239, 68, 68, 0.1)';
  if (rpe >= 8) return 'rgba(249, 115, 22, 0.1)';
  if (rpe >= 7) return 'rgba(245, 158, 11, 0.1)';
  return 'rgba(0, 255, 65, 0.1)';
}

/** Tarkka 0.5-portainen paletti (RPE-slider / treenin suunnittelu). */
export function getRpeInfo(val: number): RpeColorStyles {
  const snapped = Math.round(val * 2) / 2;

  if (snapped <= 4) {
    return { color: '#4ADE80', backgroundColor: 'rgba(74, 222, 128, 0.12)', rir: '' };
  }
  if (snapped <= 6.5) {
    return { color: '#86EFAC', backgroundColor: 'rgba(134, 239, 172, 0.12)', rir: '4+ RIR' };
  }
  if (snapped === 7) {
    return { color: '#FACC15', backgroundColor: 'rgba(250, 204, 21, 0.12)', rir: '3 RIR' };
  }
  if (snapped === 7.5) {
    return { color: '#EAB308', backgroundColor: 'rgba(234, 179, 8, 0.12)', rir: '2.5 RIR' };
  }
  if (snapped === 8) {
    return { color: '#F97316', backgroundColor: 'rgba(249, 115, 22, 0.12)', rir: '2 RIR' };
  }
  if (snapped === 8.5) {
    return { color: '#EA580C', backgroundColor: 'rgba(234, 88, 12, 0.12)', rir: '1.5 RIR' };
  }
  if (snapped === 9) {
    return { color: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.12)', rir: '1 RIR' };
  }
  if (snapped === 9.5) {
    return { color: '#DC2626', backgroundColor: 'rgba(220, 38, 38, 0.12)', rir: '0.5 RIR' };
  }
  return { color: '#B91C1C', backgroundColor: 'rgba(185, 28, 28, 0.12)', rir: '0 RIR' };
}

/** Badge-tyyli — session summary -värit + RIR-kuvaus slider-paletista. */
export function getRpeStyles(rpe: number): { color: string; backgroundColor: string; rir: string } {
  return {
    color: getRpeColor(rpe),
    backgroundColor: getRpeBg(rpe),
    rir: getRpeInfo(rpe).rir,
  };
}
