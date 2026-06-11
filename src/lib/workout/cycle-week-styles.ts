export interface CycleWeekStyle {
  border: string;
  text: string;
  accent: string;
  ring: string;
}

const WEEK_PALETTE: CycleWeekStyle[] = [
  {
    border: 'border-sky-400/35',
    text: 'text-sky-400',
    accent: 'bg-sky-400',
    ring: 'ring-sky-400/30',
  },
  {
    border: 'border-purple-400/35',
    text: 'text-purple-400',
    accent: 'bg-purple-400',
    ring: 'ring-purple-400/30',
  },
  {
    border: 'border-emerald-400/35',
    text: 'text-emerald-400',
    accent: 'bg-emerald-400',
    ring: 'ring-emerald-400/30',
  },
  {
    border: 'border-pink-400/35',
    text: 'text-pink-400',
    accent: 'bg-pink-400',
    ring: 'ring-pink-400/30',
  },
  {
    border: 'border-orange-400/35',
    text: 'text-orange-400',
    accent: 'bg-orange-400',
    ring: 'ring-orange-400/30',
  },
  {
    border: 'border-teal-400/35',
    text: 'text-teal-400',
    accent: 'bg-teal-400',
    ring: 'ring-teal-400/30',
  },
];

const DELOAD_STYLE: CycleWeekStyle = {
  border: 'border-orange-500/40',
  text: 'text-orange-400',
  accent: 'bg-orange-500',
  ring: 'ring-orange-500/30',
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
