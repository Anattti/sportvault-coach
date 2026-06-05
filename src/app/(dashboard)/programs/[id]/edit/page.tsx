'use client';

import { useParams } from 'next/navigation';
import WorkoutBuilder from '@/components/workout/WorkoutBuilder';

export default function EditProgramPage() {
  const params = useParams();
  const workoutId = params.id as string;

  return (
    <WorkoutBuilder
      mode="template"
      workoutId={workoutId}
      returnPath="/programs"
      title="Muokkaa treeniä"
    />
  );
}
