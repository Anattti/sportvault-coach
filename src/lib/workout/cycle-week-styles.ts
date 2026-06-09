export interface CycleWeekStyle {
  border: string;
  bg: string;
  text: string;
  accent: string;
  ring: string;
}

const WEEK_PALETTE: CycleWeekStyle[] = [
  {
    border: 'border-cyan-400/30',
    bg: 'bg-cyan-400/[0.06]',
    text: 'text-cyan-400',
    accent: 'bg-cyan-400',
    ring: 'ring-cyan-400/20',
  },
  {
    border: 'border-violet-400/30',
    bg: 'bg-violet-400/[0.06]',
    text: 'text-violet-400',
    accent: 'bg-violet-400',
    ring: 'ring-violet-400/20',
  },
  {
    border: 'border-emerald-400/30',
    bg: 'bg-emerald-400/[0.06]',
    text: 'text-emerald-400',
    accent: 'bg-emerald-400',
    ring: 'ring-emerald-400/20',
  },
  {
    border: 'border-rose-400/30',
    bg: 'bg-rose-400/[0.06]',
    text: 'text-rose-400',
    accent: 'bg-rose-400',
    ring: 'ring-rose-400/20',
  },
  {
    border: 'border-amber-400/30',
    bg: 'bg-amber-400/[0.06]',
    text: 'text-amber-400',
    accent: 'bg-amber-400',
    ring: 'ring-amber-400/20',
  },
  {
    border: 'border-sky-400/30',
    bg: 'bg-sky-400/[0.06]',
    text: 'text-sky-400',
    accent: 'bg-sky-400',
    ring: 'ring-sky-400/20',
  },
];

const DELOAD_STYLE: CycleWeekStyle = {
  border: 'border-orange-500/40',
  bg: 'bg-orange-500/[0.08]',
  text: 'text-orange-400',
  accent: 'bg-orange-500',
  ring: 'ring-orange-500/25',
};

export function getCycleWeekStyle(week: number, isDeload: boolean): CycleWeekStyle {
  if (isDeload) return DELOAD_STYLE;
  return WEEK_PALETTE[(week - 1) % WEEK_PALETTE.length];
}

export function groupSetBlocksByWeek<T extends { cycleWeek?: number }>(
  setBlocks: T[],
  cycleWeeks: number,
): { week: number; blocks: T[] }[] {
  return Array.from({ length: cycleWeeks }, (_, i) => {
    const week = i + 1;
    return {
      week,
      blocks: setBlocks.filter((b) => (b.cycleWeek ?? 1) === week),
    };
  });
}
