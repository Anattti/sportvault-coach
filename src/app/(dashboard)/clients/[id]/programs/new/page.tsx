'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import WorkoutBuilder from '@/components/workout/WorkoutBuilder';
import { Loader2 } from 'lucide-react';

export default function NewClientProgramPage() {
  const params = useParams();
  const clientId = params.id as string;
  const supabase = createClient();
  const [coachId, setCoachId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCoachId(data.user?.id ?? null);
      setLoading(false);
    });
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <WorkoutBuilder
      mode="client"
      targetUserId={clientId}
      coachId={coachId ?? undefined}
      returnPath={`/clients/${clientId}/programs`}
      title="Luo treeni asiakkaalle"
    />
  );
}
