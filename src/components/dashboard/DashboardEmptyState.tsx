import Link from 'next/link';
import { ClipboardList, Plus, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InviteClientDialog from '@/components/clients/InviteClientDialog';

interface DashboardEmptyStateProps {
  coachId: string;
  pendingInvites: number;
}

const steps = [
  {
    step: 1,
    icon: UserPlus,
    title: 'Kutsu ensimmäinen asiakas',
    description: 'Lähetä kutsulinkki urheilijalle SportVault-sovellukseen.',
  },
  {
    step: 2,
    icon: ClipboardList,
    title: 'Luo treeniohjelma',
    description: 'Rakenna ohjelma kirjastoon ja määritä se asiakkaalle.',
  },
  {
    step: 3,
    icon: Users,
    title: 'Seuraa edistymistä',
    description: 'Treenit, volyymi ja RPE näkyvät täällä automaattisesti.',
  },
];

export default function DashboardEmptyState({
  coachId,
  pendingInvites,
}: DashboardEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-card/30 p-8 md:p-12">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/[0.04] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/[0.03] blur-3xl" />

      <div className="relative mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/25 shadow-neon-sm">
          <Users className="h-7 w-7 text-primary" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Aloita valmentaminen
        </h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">
          {pendingInvites > 0
            ? `${pendingInvites} kutsu odottaa hyväksyntää. Kun asiakas liittyy, näet treenit täällä.`
            : 'Sinulla ei vielä ole asiakkaita. Kutsu ensimmäinen urheilija aloittaaksesi.'}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <InviteClientDialog coachId={coachId} />
          <Button
            variant="outline"
            className="border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
            render={<Link href="/programs/new" />}
            nativeButton={false}
          >
            <Plus className="mr-2 h-4 w-4" />
            Luo ohjelma
          </Button>
        </div>
      </div>

      <div className="relative mt-12 grid gap-4 md:grid-cols-3">
        {steps.map(({ step, icon: Icon, title, description }) => (
          <div
            key={step}
            className="glass-panel rounded-xl p-5 text-left transition-colors hover:border-white/12"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary ring-1 ring-primary/20">
                {step}
              </span>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
