'use client';

import { useParams } from 'next/navigation';
import WorkoutBuilder from '@/components/workout/WorkoutBuilder';

export default function EditClientProgramPage() {
  const params = useParams();
  const clientId = params.id as string;
  const workoutId = params.workoutId as string;

  return (
    <WorkoutBuilder
      mode="client"
      workoutId={workoutId}
      targetUserId={clientId}
      returnPath={`/clients/${clientId}/programs`}
      title="Muokkaa asiakkaan treeniä"
    />
  );
}
