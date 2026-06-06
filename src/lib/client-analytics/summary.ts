import { DevelopmentSummary, ExerciseProgressRow } from '@/types';
import { computeVolumeChangePercent } from './load';
import { computeStrengthChangePercent } from './progress';

function trendFromPercent(percent: number | null): 'up' | 'down' | 'neutral' {
  if (percent == null) return 'neutral';
  if (percent > 2) return 'up';
  if (percent < -2) return 'down';
  return 'neutral';
}

export function buildDevelopmentSummary(
  exerciseProgress: ExerciseProgressRow[],
  volumeChangePercent: number | null,
  prCount: number,
  compliancePercent: number | null,
  periodWeeks: number,
): DevelopmentSummary {
  const strengthChangePercent = computeStrengthChangePercent(exerciseProgress);
  const strengthTrend = trendFromPercent(strengthChangePercent);
  const volumeTrend = trendFromPercent(volumeChangePercent);

  const parts: string[] = [];

  if (strengthTrend === 'up') {
    parts.push('Voima kehittyy');
  } else if (strengthTrend === 'down') {
    parts.push('Voima laskussa');
  }

  if (volumeTrend === 'up') {
    parts.push('volyymi kasvaa');
  } else if (volumeTrend === 'down') {
    parts.push('volyymi laskussa');
  }

  if (prCount > 0) {
    parts.push(
      prCount === 1
        ? '1 uusi ennätys'
        : `${prCount} uutta ennätystä`,
    );
  }

  if (compliancePercent != null) {
    if (compliancePercent >= 80) {
      parts.push('hyvä noudattaminen');
    } else if (compliancePercent < 60) {
      parts.push('noudattaminen heikko');
    }
  }

  let interpretation: string;
  if (parts.length === 0) {
    interpretation =
      exerciseProgress.length === 0
        ? 'Ei vielä tarpeeksi dataa kehityksen arviointiin.'
        : `Ei merkittävää muutosta viimeisen ${periodWeeks} viikon aikana.`;
  } else {
    const sentence = parts.join(', ');
    interpretation = `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)} viimeisen ${periodWeeks} viikon aikana.`;
  }

  return {
    strengthChangePercent,
    volumeChangePercent,
    prCount,
    compliancePercent,
    interpretation,
    strengthTrend,
    volumeTrend,
  };
}
