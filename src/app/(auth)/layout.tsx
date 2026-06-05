import React from 'react';
import PulsingLogo from '@/components/loading/PulsingLogo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <PulsingLogo width={28} height={28} />
        <span className="font-bold text-lg text-foreground tracking-tight ml-1">SportVault Coach</span>
      </div>
      
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
