import {
  Activity,
  Dumbbell,
  LucideIcon,
  Move,
  Rocket,
  Zap,
} from 'lucide-react';

export interface WorkoutTypeConfig {
  label: string;
  icon: LucideIcon;
}

export const WORKOUT_TYPE_CONFIG: Record<string, WorkoutTypeConfig> = {
  endurance_basic: { label: 'Peruskestävyys', icon: Activity },
  endurance_max: { label: 'Maksimikestävyys', icon: Zap },
  strength: { label: 'Voima', icon: Dumbbell },
  speed_explosive: { label: 'Nopeus & räjähtävyys', icon: Rocket },
  mobility: { label: 'Liikkuvuus', icon: Move },
};

export function getWorkoutTypeConfig(type: string): WorkoutTypeConfig {
  return (
    WORKOUT_TYPE_CONFIG[type] ?? {
      label: type.replace(/_/g, ' '),
      icon: Dumbbell,
    }
  );
}
