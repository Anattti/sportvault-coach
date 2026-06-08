import { differenceInDays, parseISO, subDays } from 'date-fns';
import {
  getPortfolioVolumeSpike,
  hasClientVolumeSpike,
  isRpeElevated,
} from '@/lib/dashboard/metrics';
import { AttentionClient, CoachClient } from '@/types';

type SessionLike = {
  id: string;
  date: string | null;
  duration: number | null;
  total_volume: number | null;
  rpe_average: number | null;
};

export interface ClientAttentionAlert {
  reason: AttentionClient['reason'];
  detail?: string;
  lastSessionDate: string | null;
  daysInactive: number | null;
}

const ATTENTION_PRIORITY: Record<AttentionClient['reason'], number> = {
  pending: 0,
  no_program: 1,
  program_stuck: 2,
  volume_spike: 3,
  high_rpe: 4,
  no_sessions: 5,
  inactive: 6,
};

export function resolveClientAttentionAlerts(params: {
  status: CoachClient['status'];
  sessions: SessionLike[];
  hasAssignedProgram: boolean;
  programStuck: boolean;
  cycleWeek: number | null;
  lastSessionDate: string | null;
}): ClientAttentionAlert[] {
  const {
    status,
    sessions,
    hasAssignedProgram,
    programStuck,
    cycleWeek,
    lastSessionDate,
  } = params;

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const alerts: ClientAttentionAlert[] = [];

  if (status === 'pending') {
    alerts.push({
      reason: 'pending',
      lastSessionDate: null,
      daysInactive: null,
      detail: 'Kutsu lähetetty, odottaa liittymistä',
    });
    return alerts;
  }

  if (status !== 'active') return alerts;

  if (!hasAssignedProgram) {
    alerts.push({
      reason: 'no_program',
      lastSessionDate,
      daysInactive: null,
      detail: 'Määritä treeniohjelma asiakkaalle',
    });
  }

  if (programStuck) {
    alerts.push({
      reason: 'program_stuck',
      lastSessionDate,
      daysInactive: null,
      detail:
        cycleWeek != null
          ? `Viikko ${cycleWeek} ei etene`
          : 'Jakson viikko ei etene',
    });
  }

  if (hasClientVolumeSpike(sessions)) {
    const spike = getPortfolioVolumeSpike(sessions);
    alerts.push({
      reason: 'volume_spike',
      lastSessionDate,
      daysInactive: null,
      detail: spike
        ? `Volyymi +${Math.round(spike.percentChange)} % keskiarvoon`
        : 'Kuormitus noussut nopeasti',
    });
  }

  if (isRpeElevated(sessions)) {
    alerts.push({
      reason: 'high_rpe',
      lastSessionDate,
      daysInactive: null,
      detail: 'Keskim. RPE > 8.5 viimeisillä treeneillä',
    });
  }

  const lastSessionTime = lastSessionDate ? parseISO(lastSessionDate) : null;
  const inactive = !lastSessionTime || lastSessionTime < sevenDaysAgo;

  if (inactive) {
    const daysInactive = lastSessionDate
      ? differenceInDays(now, parseISO(lastSessionDate))
      : null;

    alerts.push({
      reason: lastSessionDate ? 'inactive' : 'no_sessions',
      lastSessionDate,
      daysInactive,
    });
  }

  alerts.sort((a, b) => ATTENTION_PRIORITY[a.reason] - ATTENTION_PRIORITY[b.reason]);

  return alerts;
}
