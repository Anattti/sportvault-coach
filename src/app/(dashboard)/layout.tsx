import React from 'react';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { ToastProvider } from '@/components/ui/toast';
import { getWorkoutNotifications } from '@/lib/dashboard/notifications';
import { getCoachProfileId } from '@/lib/supabase/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const coachProfileId = await getCoachProfileId();
  if (!coachProfileId) {
    redirect('/onboarding');
  }

  const notifications = await getWorkoutNotifications();

  return (
    <ToastProvider>
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar notifications={notifications} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
    </ToastProvider>
  );
}
