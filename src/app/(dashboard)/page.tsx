import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getDashboardData } from '@/lib/dashboard/queries';
import { getWorkoutNotifications } from '@/lib/dashboard/notifications';
import CoachActivityFeed from '@/components/dashboard/CoachActivityFeed';
import AttentionBanner from '@/components/dashboard/AttentionBanner';
import ClientSummaryTable from '@/components/dashboard/ClientSummaryTable';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
import NewWorkoutsBanner from '@/components/dashboard/NewWorkoutsBanner';
import InviteClientDialog from '@/components/clients/InviteClientDialog';
import { Button } from '@/components/ui/button';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 10) return 'Huomenta';
  if (hour < 18) return 'Hyvää päivää';
  return 'Hyvää iltaa';
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const data = await getDashboardData();
  if (!data) return null;

  const notifications = await getWorkoutNotifications();

  const {
    coachName,
    stats,
    clientOverviews,
    attentionClients,
    recentSessions,
    recentPRs,
    hasClients,
  } = data;

  const showFullDashboard = stats.activeClients > 0 || stats.sessionsThisWeek > 0;

  return (
    <div className="space-y-5">
      {/* Header — kompakti */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary/80">{getGreeting()}</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {coachName}
          </h1>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <InviteClientDialog coachId={user.id} />
          <Button
            variant="outline"
            className="border-white/10 bg-white/[0.03] hover:border-primary/30 hover:bg-white/[0.06]"
            render={<Link href="/programs/new" />}
            nativeButton={false}
          >
            <Plus className="mr-2 h-4 w-4" />
            Uusi ohjelma
          </Button>
        </div>
      </div>

      {!hasClients ? (
        <DashboardEmptyState coachId={user.id} pendingInvites={stats.pendingInvites} />
      ) : (
        <>
          {/* Ilmoitukset — uudet treenit */}
          <NewWorkoutsBanner notifications={notifications} />

          {/* Huomioita vaativat urheilijat */}
          <AttentionBanner clients={attentionClients} />

          {showFullDashboard ? (
            <>
              {/* Urheilijoiden yhteenveto — ensimmäisenä sisältönä */}
              <ClientSummaryTable clients={clientOverviews} />

              {/* Viimeisimmät treenit — kompakti feed PR-merkkauksin */}
              <CoachActivityFeed
                sessions={recentSessions}
                records={recentPRs}
                maxItems={5}
              />
            </>
          ) : (
            <DashboardEmptyState coachId={user.id} pendingInvites={stats.pendingInvites} />
          )}
        </>
      )}
    </div>
  );
}
