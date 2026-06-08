'use client';

import Link from 'next/link';
import PulsingLogo from '@/components/loading/PulsingLogo';
import { usePathname } from 'next/navigation';
import { SheetClose } from '@/components/ui/sheet';
import {
  dashboardNavItems,
  getNavIconClassName,
  getNavLinkClassName,
  isNavItemActive,
} from '@/config/navigation';

export default function MobileSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#121212]/95 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)] pl-[env(safe-area-inset-left,0px)] pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex h-16 items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <PulsingLogo width={28} height={28} />
          <span className="font-bold text-lg text-foreground tracking-tight ml-1">SportVault Coach</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-3 py-4">
          {dashboardNavItems.map((item) => {
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <SheetClose
                key={item.name}
                nativeButton={false}
                render={
                  <Link href={item.href} className={getNavLinkClassName(isActive, 'mobile')} />
                }
              >
                <item.icon className={getNavIconClassName(isActive, 'mobile')} aria-hidden="true" />
                {item.name}
              </SheetClose>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
