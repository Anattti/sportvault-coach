import { formatWorkoutUpdateMeta } from '@/lib/workouts/update-meta';

interface WorkoutUpdateMetaProps {
  updatedAt: string;
  updatedBy?: string | null;
  ownerId: string;
  updaterNickname?: string | null;
  viewerId?: string;
  className?: string;
}

export default function WorkoutUpdateMeta({
  updatedAt,
  updatedBy,
  ownerId,
  updaterNickname,
  viewerId,
  className,
}: WorkoutUpdateMetaProps) {
  return (
    <p className={className}>
      {formatWorkoutUpdateMeta({
        updatedAt,
        updatedBy,
        ownerId,
        updaterNickname,
        viewerId,
      })}
    </p>
  );
}
