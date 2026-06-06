import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getClientAnalytics } from '@/lib/client-analytics/queries';
import DevelopmentHero from '@/components/client-analytics/DevelopmentHero';
import ExerciseProgressTable from '@/components/client-analytics/ExerciseProgressTable';
import PersonalRecordsTimeline from '@/components/client-analytics/PersonalRecordsTimeline';
import LoadCharts from '@/components/client-analytics/LoadCharts';
import RpeTrendChart from '@/components/client-analytics/RpeTrendChart';
import ComplianceChart from '@/components/client-analytics/ComplianceChart';
import CycleProgressChart from '@/components/client-analytics/CycleProgressChart';
import AdherenceSummaryCard from '@/components/client-analytics/AdherenceSummaryCard';
import MultiE1RMCharts from '@/components/client-analytics/MultiE1RMCharts';
import PeriodSelector from '@/components/client-analytics/PeriodSelector';

export default async function ClientAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const clientId = resolvedParams.id;

  const periodParam = Number(resolvedSearch.period);
  const periodWeeks = [4, 8, 12].includes(periodParam) ? periodParam : 8;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const analytics = await getClientAnalytics(clientId, user.id, { periodWeeks });

  if (!analytics) {
    return (
      <div className="text-muted-foreground">
        Analytiikkadataa ei voitu ladata.
      </div>
    );
  }

  if (!analytics.hasSessions) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kehitysanalyysi</h2>
          <p className="text-muted-foreground">Seuraa urheilijan progressiota volyymin, voiman ja noudattamisen avulla.</p>
        </div>
        <div className="glass-panel rounded-2xl p-12 text-center text-muted-foreground">
          <p>Urheilijalla ei ole vielä treenidataa analyysiin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kehitysanalyysi</h2>
          <p className="text-muted-foreground">
            Voima, kuormitus, noudattaminen ja ohjelman toteutus — kaikki yhdessä näkymässä.
          </p>
        </div>
        <PeriodSelector current={periodWeeks} />
      </div>

      <DevelopmentHero summary={analytics.summary} periodWeeks={periodWeeks} />

      <ExerciseProgressTable exercises={analytics.exerciseProgress} />

      <MultiE1RMCharts exercises={analytics.exerciseProgress} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PersonalRecordsTimeline
          records={analytics.personalRecords}
          clientId={clientId}
        />
        <RpeTrendChart data={analytics.load.weeklyRpe} />
      </div>

      <LoadCharts load={analytics.load} />

      <div className="grid gap-6 lg:grid-cols-2">
        <ComplianceChart
          history={analytics.complianceHistory}
          trainingStreakWeeks={analytics.trainingStreakWeeks}
          programStuck={analytics.programStuck}
        />
        <CycleProgressChart data={analytics.cycleProgress} />
      </div>

      <AdherenceSummaryCard adherence={analytics.adherence} />
    </div>
  );
}
