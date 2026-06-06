import {
  ClipboardList,
  LayoutDashboard,
  LucideIcon,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

/** Vain olemassa olevat reitit — ei 404-linkkejä */
export const dashboardNavItems: NavItem[] = [
  { name: 'Yleiskatsaus', href: '/', icon: LayoutDashboard },
  { name: 'Asiakkaat', href: '/clients', icon: Users },
  { name: 'Ohjelmat', href: '/programs', icon: ClipboardList },
];

export function isNavItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Sama teema kuin "Kutsu asiakas" -primary-nappi */
export const primaryActiveClassName =
  'bg-primary text-primary-foreground shadow-[0_0_8px_rgba(0,255,65,0.3)] hover:bg-primary/90';

export function getNavLinkClassName(isActive: boolean, size: 'default' | 'mobile' = 'default') {
  return cn(
    'group flex items-center font-semibold transition-all duration-200 rounded-lg',
    size === 'mobile' ? 'px-4 py-3 text-base mb-1' : 'px-4 py-2.5 text-sm',
    isActive ? primaryActiveClassName : 'text-white/60 hover:bg-white/5 hover:text-white',
  );
}

export function getNavIconClassName(isActive: boolean, size: 'default' | 'mobile' = 'default') {
  return cn(
    'flex-shrink-0 transition-colors duration-200',
    size === 'mobile' ? 'mr-4 h-6 w-6' : 'mr-3 h-5 w-5',
    isActive ? 'text-primary-foreground' : 'text-white/60 group-hover:text-white',
  );
}

export function isClientTabActive(
  pathname: string | null,
  href: string,
  baseUrl: string,
): boolean {
  if (!pathname) return false;
  if (href === baseUrl) return pathname === baseUrl;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getClientTabLinkClassName(isActive: boolean) {
  return cn(
    'group inline-flex items-center font-semibold transition-all duration-200 rounded-lg px-3 py-2 text-sm whitespace-nowrap',
    isActive
      ? primaryActiveClassName
      : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
  );
}

export function getClientTabIconClassName(isActive: boolean) {
  return cn(
    'mr-2 h-4 w-4 flex-shrink-0 transition-colors duration-200',
    isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground',
  );
}
