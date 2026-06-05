'use client';

import WorkoutBuilder from '@/components/workout/WorkoutBuilder';

export default function NewProgramPage() {
  return (
    <WorkoutBuilder
      mode="template"
      returnPath="/programs"
      title="Luo uusi treeni"
    />
  );
}
