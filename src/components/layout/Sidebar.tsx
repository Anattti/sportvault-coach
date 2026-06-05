'use client';

import Link from 'next/link';
import Image from 'next/image';
import PulsingLogo from '@/components/loading/PulsingLogo';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ClipboardList, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Yleiskatsaus', href: '/', icon: LayoutDashboard },
  { name: 'Asiakkaat', href: '/clients', icon: Users },
  { name: 'Ohjelmat', href: '/programs', icon: ClipboardList },
  { name: 'Laskutus', href: '/billing', icon: CreditCard },
  { name: 'Asetukset', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r border-white/5 bg-[#121212]/80 backdrop-blur-xl md:flex md:w-64 md:flex-col">
      <div className="flex h-14 items-center border-b border-white/5 px-4 py-4 sm:h-16">
        <div className="flex items-center gap-2">
          <PulsingLogo width={28} height={28} />
          <span className="font-bold text-lg text-foreground tracking-tight ml-1">SportVault Coach</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_15px_rgba(0,255,65,0.15)]'
                    : 'text-white/60 hover:bg-white/5 hover:text-white',
                  'group flex items-center px-4 py-3 text-sm font-medium rounded-full transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-primary drop-shadow-[0_0_8px_rgba(0,255,65,0.5)]' : 'text-white/60 group-hover:text-white',
                    'mr-3 h-5 w-5 flex-shrink-0 transition-all duration-300'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
