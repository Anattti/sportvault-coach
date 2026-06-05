import React from 'react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Yleiskatsaus</h1>
        <p className="text-muted-foreground">Tervetuloa valmentajan ohjauspaneeliin.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* KPI Cards */}
        <div className="glass-panel rounded-2xl p-6 transition-all duration-300 hover:shadow-neon-sm relative overflow-hidden group">
          {/* Subtle glow background effect */}
          <div className="absolute -inset-1 bg-accent/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
          
          <div className="relative z-10">
            <div className="flex flex-row items-center justify-between pb-4">
              <h3 className="tracking-tight text-sm font-medium text-muted-foreground uppercase">Aktiiviset Asiakkaat</h3>
            </div>
            <div>
              <div className="text-4xl font-bold text-foreground">0</div>
              <p className="text-xs text-accent mt-1">+0 tällä viikolla</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
