export interface CoachClient {
  id: string;
  coach_id: string;
  client_id: string;
  status: 'pending' | 'active' | 'paused' | 'ended';
  invited_at: string;
  accepted_at: string | null;
  notes: string | null;
  // Joinattu profiilidata
  profile?: {
    nickname: string | null;
    age: number | null;
    weight: number | null;
    height: number | null;
    experience_level: string | null;
  };
}

// Dashboard-kooste per asiakas
export interface ClientOverview {
  clientId: string;
  nickname: string;
  lastSessionDate: string | null;
  totalSessionsThisWeek: number;
  totalVolumeThisWeek: number;
  avgRpe: number | null;
  status: 'active' | 'inactive'; // inactive = ei treenannut 7+ päivään
}

// Treenisession yhteenveto (listanäkymä)
export interface SessionSummary {
  id: string;
  date: string;
  duration: number;
  totalVolume: number;
  workoutName: string | null;
  workoutType: string | null;
  feeling: number | null;
  rpeAverage: number | null;
  heartRateAvg: number | null;
  heartRateMax: number | null;
  exerciseCount: number;
  hasCoachNote: boolean;
}

// Treenisession täysi data (detail-näkymä)
export interface SessionDetail {
  session: {
    id: string;
    date: string;
    duration: number;
    totalVolume: number;
    feeling: number | null;
    rpeAverage: number | null;
    notes: string | null;
    warmup: WarmupData | null;
    cooldown: CooldownData | null;
    heartRateAvg: number | null;
    heartRateMax: number | null;
    heartRateSamples: HeartRateSample[] | null;
    cycleWeek: number | null;
    workoutName: string | null;
    cycleWeeks: number | null;
  };
  exercises: SessionExerciseDetail[];
  coachNote: string | null;
}

export interface SessionExerciseDetail {
  id: string;
  name: string;
  orderIndex: number;
  notes: string | null;
  heartRateAvg: number | null;
  heartRateMax: number | null;
  sets: SessionSetDetail[];
  coachNote: string | null;
}

export interface SessionSetDetail {
  setIndex: number;
  weightUsed: number | null;
  repsCompleted: number | null;
  rpe: number | null;
  restTimeTaken: number | null;
  notes: string | null;
  completedAt: string | null;
}

export interface HeartRateSample {
  time: number; // Seconds since workout start
  bpm: number;
}

export interface WarmupData {
  duration: number;
  exercises: Array<{
    id: string;
    name: string;
    duration: number;
    type: 'cardio' | 'dynamic_stretch' | 'static_stretch' | 'mobility';
    completed?: boolean;
  }>;
  skipped: boolean;
}

export interface CooldownData {
  duration: number;
  exercises: Array<{
    id: string;
    name: string;
    duration: number;
    type: 'cardio' | 'dynamic_stretch' | 'static_stretch' | 'mobility';
    completed?: boolean;
  }>;
  skipped: boolean;
}

// Program Builder tyypit
export interface ProgramTemplate {
  id?: string;
  program: string;
  workoutType: string;
  duration: number;
  notes: string | null;
  progression: 'linear' | 'double_progression' | 'wave' | 'rpe_based' | null;
  progressionPercentage: string | null;
  cycleWeeks: number;
  programmedDeloads: number[] | null;
  exercises: ProgramExercise[];
}

export interface ProgramExercise {
  id: string; // temp UUID for DnD
  name: string;
  category: string | null;
  supersetGroup: number | null;
  targetRpe: number | null;
  sets: ProgramSet[];
}

export interface ProgramSet {
  id: string;
  weight: number;
  reps: number;
  sets: number;
  restTime: number;
  rpe: number | null;
  isBodyweight: boolean;
  targetType: string | null;
  cycleWeek: number | null;
}
