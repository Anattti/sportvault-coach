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
    fitness_goals?: string | null;
  };
}

// Dashboard-kooste per asiakas
export interface ClientOverview {
  clientId: string;
  nickname: string;
  lastSessionDate: string | null;
  totalSessionsThisWeek: number;
  totalVolumeThisWeek: number;
  volumeChangePercent: number | null;
  avgRpe: number | null;
  rpeElevated: boolean;
  trainedThisWeek: boolean;
  cycleWeek: number | null;
  cycleWeeks: number | null;
  programmedDeloads: number[];
  isDeloadWeek: boolean;
  hasCycle: boolean;
  programName: string | null;
  activeProgramName: string | null;
  hasAssignedProgram: boolean;
  plannedSessionsThisWeek: number | null;
  compliancePercent: number | null;
  programStuck: boolean;
  topExerciseName: string | null;
  topExerciseE1RM: number | null;
  topExerciseTrend: 'up' | 'down' | 'stable' | null;
  status: 'active' | 'inactive'; // inactive = ei treenannut 7+ päivään
}

export interface PersonalRecord {
  clientId: string;
  clientNickname: string;
  exerciseName: string;
  e1rm: number;
  previousBest: number;
  improvementPercent: number;
  sessionId: string;
  date: string;
}

export interface ClientPersonalRecord {
  exerciseName: string;
  e1rm: number;
  previousBest: number;
  improvementPercent: number;
  sessionId: string;
  date: string;
}

export interface ExerciseProgressRow {
  exerciseName: string;
  sessionCount: number;
  currentE1RM: number;
  bestE1RM: number;
  changePercent: number | null;
  trend: 'up' | 'down' | 'stable';
  history: Array<{ date: string; value: number }>;
}

export interface DevelopmentSummary {
  strengthChangePercent: number | null;
  volumeChangePercent: number | null;
  prCount: number;
  compliancePercent: number | null;
  interpretation: string;
  strengthTrend: 'up' | 'down' | 'neutral';
  volumeTrend: 'up' | 'down' | 'neutral';
}

export interface ComplianceWeek {
  label: string;
  planned: number;
  completed: number;
  compliancePercent: number | null;
  isCurrentWeek: boolean;
}

export interface CycleProgressPoint {
  date: string;
  cycleWeek: number;
  workoutId: string | null;
  programStuck: boolean;
}

export interface AdherenceSummary {
  setCompletionPercent: number | null;
  avgWeightDeviationPercent: number | null;
  avgRepsDeviation: number | null;
  avgRpeDeviation: number | null;
  swapPercent: number | null;
  adHocPercent: number | null;
  sessionsAnalyzed: number;
}

export interface LoadMetrics {
  acwr: number | null;
  acwrWarning: boolean;
  weeklyVolume: WeeklyMetricPoint[];
  weeklySessions: WeeklyMetricPoint[];
  weeklyRpe: WeeklyMetricPoint[];
  volumeSpike: VolumeSpikeAlert | null;
  avgIntensity: number | null;
}

export interface ClientAnalyticsData {
  periodWeeks: number;
  hasSessions: boolean;
  primaryWorkoutType: string | null;
  summary: DevelopmentSummary;
  exerciseProgress: ExerciseProgressRow[];
  personalRecords: ClientPersonalRecord[];
  load: LoadMetrics;
  complianceHistory: ComplianceWeek[];
  cycleProgress: CycleProgressPoint[];
  trainingStreakWeeks: number;
  programStuck: boolean;
  adherence: AdherenceSummary;
}

export interface AttentionClient {
  clientId: string;
  nickname: string;
  reason:
    | 'inactive'
    | 'pending'
    | 'no_sessions'
    | 'high_rpe'
    | 'volume_spike'
    | 'no_program'
    | 'program_stuck';
  lastSessionDate: string | null;
  daysInactive: number | null;
  detail?: string;
}

export interface CoachActivitySession extends SessionSummary {
  clientId: string;
  clientNickname: string;
  isNew?: boolean;
}

export interface WorkoutNotification {
  id: string;
  clientId: string;
  clientNickname: string;
  workoutName: string | null;
  date: string;
  totalVolume: number;
  createdAt: string;
}

export interface WeeklyVolumePoint {
  label: string;
  volume: number;
  isCurrentWeek: boolean;
}

export interface WeeklyMetricPoint {
  label: string;
  value: number;
  isCurrentWeek: boolean;
}

export interface VolumeSpikeAlert {
  hasSpike: boolean;
  percentChange: number;
  currentVolume: number;
  avgVolume: number;
}

// Treenisession yhteenveto (listanäkymä)
export interface SessionSummary {
  id: string;
  date: string;
  duration: number;
  totalVolume: number;
  workoutId: string | null;
  workoutName: string | null;
  workoutType: string | null;
  feeling: number | null;
  rpeAverage: number | null;
  heartRateAvg: number | null;
  heartRateMax: number | null;
  exerciseCount: number;
  hasCoachNote: boolean;
  cycleWeek: number | null;
  cycleWeeks: number | null;
}

export interface WorkoutHistoryMeta {
  workoutId: string;
  programName: string;
  workoutType: string | null;
  cycleWeeks: number | null;
  programmedDeloads: number[];
  totalSessions: number;
  avgRpe: number | null;
  latestVolume: number | null;
  currentWeek: number | null;
}

export interface WorkoutHistorySession extends SessionSummary {
  volumeChangePercent: number | null;
}

export interface WeekHistoryGroup {
  cycleWeek: number;
  isDeload: boolean;
  sessions: WorkoutHistorySession[];
  isEmpty: boolean;
}

export interface CycleRunGroup {
  runIndex: number;
  startDate: string;
  endDate: string;
  weeks: WeekHistoryGroup[];
}

export interface WorkoutExerciseSetRow {
  setId: string;
  sessionId: string;
  date: string;
  cycleWeek: number | null;
  storedCycleWeek: number | null;
  cycleWeekInferred: boolean;
  cycleWeeks: number | null;
  setIndex: number;
  displaySetIndex: number;
  weightUsed: number | null;
  repsCompleted: number | null;
  rpe: number | null;
  e1rm: number | null;
}

export interface WorkoutExerciseHistory {
  name: string;
  orderIndex: number;
  isProgramExercise: boolean;
  rows: WorkoutExerciseSetRow[];
  bestE1rm: number | null;
  sessionCount: number;
}

export interface WorkoutHistoryData {
  meta: WorkoutHistoryMeta;
  cycleRuns: CycleRunGroup[];
  unscheduled: WorkoutHistorySession[];
  isFlatTimeline: boolean;
  flatSessions: WorkoutHistorySession[];
  exercises: WorkoutExerciseHistory[];
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
