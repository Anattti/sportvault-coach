import Link from 'next/link';
import { Users, Dumbbell, Mail, TrendingUp, Plus, Flame } from 'lucide-react';
import { getDashboardData } from '@/lib/dashboard/queries';
import { getWorkoutNotifications } from '@/lib/dashboard/notifications';
import KpiCard from '@/components/dashboard/KpiCard';
import CoachActivityFeed from '@/components/dashboard/CoachActivityFeed';
import AttentionClientsList from '@/components/dashboard/AttentionClientsList';
import ClientSummaryTable from '@/components/dashboard/ClientSummaryTable';
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState';
import DashboardWeeklyChart from '@/components/dashboard/DashboardWeeklyChart';
import RecentPrsCard from '@/components/dashboard/RecentPrsCard';
import NewWorkoutsBanner from '@/components/dashboard/NewWorkoutsBanner';
import VolumeSpikeBanner from '@/components/dashboard/VolumeSpikeBanner';
import InviteClientDialog from '@/components/clients/InviteClientDialog';
import PendingInvitations from '@/components/clients/PendingInvitations';
import { Button } from '@/components/ui/button';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 10) return 'Huomenta';
  if (hour < 18) return 'Hyvää päivää';
  return 'Hyvää iltaa';
}

function formatVolume(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toLocaleString('fi-FI', { maximumFractionDigits: 1 })} t`;
  }
  return `${kg.toLocaleString('fi-FI')} kg`;
}

function formatVolumeChange(percent: number | null): string {
  if (percent == null) return 'Ei vertailudataa';
  if (percent > 0) return `+${percent} % edelliseen vk`;
  if (percent < 0) return `${percent} % edelliseen vk`;
  return 'Ei muutosta edelliseen vk';
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
    pendingInvitations,
    weeklyVolume,
    weeklySessions,
    volumeSpike,
    recentPRs,
    hasClients,
  } = data;

  const showFullDashboard = stats.activeClients > 0 || stats.sessionsThisWeek > 0;

  const volumeChartData = weeklyVolume.map((d) => ({
    label: d.label,
    value: d.volume,
    isCurrentWeek: d.isCurrentWeek,
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary/80">{getGreeting()}</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {coachName}
          </h1>
          <p className="text-muted-foreground">
            Tässä yhteenveto valmennuksesi tilanteesta tänään.
          </p>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <KpiCard
              title="Aktiiviset asiakkaat"
              value={stats.activeClients.toString()}
              subtitle={
                stats.activeClients > 0
                  ? `${stats.trainingRatePercent} % treenasi tällä viikolla`
                  : stats.newClientsThisWeek > 0
                    ? `+${stats.newClientsThisWeek} uutta tällä viikolla`
                    : 'Ei aktiivisia asiakkaita'
              }
              icon={Users}
              trend={
                stats.trainingRatePercent >= 75
                  ? 'up'
                  : stats.trainingRatePercent > 0
                    ? 'neutral'
                    : 'neutral'
              }
            />
            <KpiCard
              title="Treenit tällä viikolla"
              value={
                stats.sessionsPlannedThisWeek > 0
                  ? `${stats.sessionsThisWeek}/${stats.sessionsPlannedThisWeek}`
                  : stats.sessionsThisWeek.toString()
              }
              subtitle={
                stats.compliancePercent != null
                  ? `${stats.compliancePercent} % suunnitelluista toteutettu`
                  : stats.sessionsThisWeek > 0
                    ? `${stats.clientsTrainedThisWeek} / ${stats.activeClients} asiakasta`
                    : 'Ei treenejä vielä'
              }
              icon={Dumbbell}
              trend={
                stats.compliancePercent != null && stats.compliancePercent >= 75
                  ? 'up'
                  : stats.compliancePercent != null && stats.compliancePercent < 50
                    ? 'down'
                    : stats.sessionsThisWeek > 0
                      ? 'neutral'
                      : 'neutral'
              }
            />
            <KpiCard
              title="Viikon volyymi"
              value={formatVolume(stats.totalVolumeThisWeek)}
              subtitle={formatVolumeChange(stats.volumeChangePercent)}
              icon={TrendingUp}
              trend={
                stats.volumeChangePercent != null && stats.volumeChangePercent > 0
                  ? 'up'
                  : stats.volumeChangePercent != null && stats.volumeChangePercent < 0
                    ? 'down'
                    : 'neutral'
              }
            />
            <KpiCard
              title="Keskimääräinen RPE"
              value={stats.avgRpeThisWeek?.toFixed(1) ?? '—'}
              subtitle={
                stats.avgRpeThisWeek != null
                  ? stats.avgRpeThisWeek > 8.5
                    ? 'Korkea — seuraa palautumista'
                    : 'Koko portfolio tällä viikolla'
                  : 'Ei RPE-dataa vielä'
              }
              icon={Flame}
              trend={stats.avgRpeThisWeek != null && stats.avgRpeThisWeek > 8.5 ? 'down' : 'neutral'}
              iconClassName={
                stats.avgRpeThisWeek != null && stats.avgRpeThisWeek > 8.5
                  ? 'bg-red-500/10 ring-red-500/20'
                  : undefined
              }
            />
            <KpiCard
              title="Odottavat kutsut"
              value={stats.pendingInvites.toString()}
              subtitle={
                stats.pendingInvites > 0
                  ? 'Odottaa hyväksyntää'
                  : 'Ei avoimia kutsuja'
              }
              icon={Mail}
              trend="neutral"
              iconClassName={
                stats.pendingInvites > 0 ? 'bg-amber-500/10 ring-amber-500/20' : undefined
              }
            />
          </div>

          {pendingInvitations.length > 0 && (
            <PendingInvitations invitations={pendingInvitations} />
          )}

          <NewWorkoutsBanner notifications={notifications} />

          {volumeSpike && <VolumeSpikeBanner spike={volumeSpike} />}

          {showFullDashboard ? (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <DashboardWeeklyChart variant="volume" data={volumeChartData} />
                <DashboardWeeklyChart variant="sessions" data={weeklySessions} />
              </div>

              <div className="grid gap-6 xl:grid-cols-3">
                <AttentionClientsList clients={attentionClients} />
                <CoachActivityFeed sessions={recentSessions} />
                <RecentPrsCard records={recentPRs} />
              </div>

              <ClientSummaryTable clients={clientOverviews} />
            </>
          ) : (
            <DashboardEmptyState coachId={user.id} pendingInvites={stats.pendingInvites} />
          )}
        </>
      )}
    </div>
  );
}
