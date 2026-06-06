'use client';

import Link from 'next/link';
import PulsingLogo from '@/components/loading/PulsingLogo';
import { usePathname } from 'next/navigation';
import { dashboardNavItems, isNavItemActive } from '@/config/navigation';
import { cn } from '@/lib/utils';

const SIDEBAR_INNER_WIDTH = 'w-64';

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'group/sidebar hidden md:flex shrink-0 overflow-hidden',
        'w-[4rem] hover:w-64',
        'transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
        'border-r border-white/5 bg-[#121212]/80 backdrop-blur-xl z-20',
      )}
    >
      {/* Kiinteä sisäleveys — vain ulkoreuna animoituu, ei sisältöä */}
      <div className={cn('flex h-full flex-col', SIDEBAR_INNER_WIDTH)}>
        <div className="flex h-14 sm:h-16 shrink-0 items-center gap-3 border-b border-white/5 px-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] ring-1 ring-white/8">
            <PulsingLogo width={26} height={26} />
          </div>
          <span className="whitespace-nowrap font-bold text-base tracking-tight text-foreground">
            SportVault Coach
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {dashboardNavItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-2 py-1.5',
                  'transition-colors duration-200',
                  !isActive && 'text-white/60 hover:bg-white/[0.05] hover:text-white',
                )}
              >
                <span
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-[0_0_8px_rgba(0,255,65,0.35)]'
                      : 'bg-white/[0.04] text-white/55 ring-1 ring-white/8 group-hover/sidebar:bg-white/[0.06]',
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    'whitespace-nowrap text-sm font-semibold',
                    isActive ? 'text-primary' : 'text-inherit',
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
