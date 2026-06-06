'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const PERIODS = [4, 8, 12] as const;

export default function PeriodSelector({ current }: { current: number }) {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-white/5 p-1 ring-1 ring-white/8">
      {PERIODS.map((weeks) => {
        const isActive = current === weeks;
        return (
          <Link
            key={weeks}
            href={`${pathname}?period=${weeks}`}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              isActive
                ? 'bg-primary text-primary-foreground shadow-neon-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {weeks} vk
          </Link>
        );
      })}
    </div>
  );
}
