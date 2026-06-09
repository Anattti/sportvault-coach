import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCycleRunGroups,
  buildExerciseHistory,
  buildInferredCycleWeekBySession,
  buildWorkoutHistoryData,
  computeVolumeChangePercent,
  enrichSessionsWithVolumeChange,
  isNewCycleRun,
  resolveDisplaySetIndex,
  splitIntoCycleRuns,
} from './workout-history';

import { SessionSummary } from '../../types';

function session(
  overrides: Partial<SessionSummary> & Pick<SessionSummary, 'id' | 'date' | 'cycleWeek'>,
): SessionSummary {
  return {
    duration: 3600,
    totalVolume: 4000,
    workoutId: 'workout-1',
    workoutName: 'Push A',
    workoutType: 'strength',
    feeling: null,
    rpeAverage: 7.5,
    heartRateAvg: null,
    heartRateMax: null,
    exerciseCount: 5,
    hasCoachNote: false,
    hasAthleteNote: false,
    cycleWeeks: 8,
    ...overrides,
  };
}

describe('isNewCycleRun', () => {
  it('detects new cycle when week resets to 1', () => {
    const prev = session({ id: '1', date: '2026-01-08', cycleWeek: 8 });
    const current = session({ id: '2', date: '2026-01-15', cycleWeek: 1 });
    assert.equal(isNewCycleRun(prev, current), true);
  });

  it('detects new cycle when week number drops', () => {
    const prev = session({ id: '1', date: '2026-02-01', cycleWeek: 6 });
    const current = session({ id: '2', date: '2026-02-08', cycleWeek: 2 });
    assert.equal(isNewCycleRun(prev, current), true);
  });

  it('does not start new cycle for consecutive weeks', () => {
    const prev = session({ id: '1', date: '2026-01-01', cycleWeek: 2 });
    const current = session({ id: '2', date: '2026-01-08', cycleWeek: 3 });
    assert.equal(isNewCycleRun(prev, current), false);
  });
});

describe('splitIntoCycleRuns', () => {
  it('splits two full cycles', () => {
    const enriched = enrichSessionsWithVolumeChange([
      session({ id: '1', date: '2026-01-01', cycleWeek: 1, totalVolume: 3000 }),
      session({ id: '2', date: '2026-01-08', cycleWeek: 2, totalVolume: 3200 }),
      session({ id: '3', date: '2026-02-01', cycleWeek: 1, totalVolume: 3100 }),
      session({ id: '4', date: '2026-02-08', cycleWeek: 2, totalVolume: 3300 }),
    ]);

    const runs = splitIntoCycleRuns(enriched);
    assert.equal(runs.length, 2);
    assert.equal(runs[0].length, 2);
    assert.equal(runs[1].length, 2);
  });
});

describe('computeVolumeChangePercent', () => {
  it('returns rounded percent change', () => {
    assert.equal(computeVolumeChangePercent(4200, 4000), 5);
    assert.equal(computeVolumeChangePercent(3920, 4000), -2);
  });

  it('returns null when previous volume missing', () => {
    assert.equal(computeVolumeChangePercent(4000, null), null);
  });
});

describe('enrichSessionsWithVolumeChange', () => {
  it('compares sessions with same cycle week chronologically', () => {
    const enriched = enrichSessionsWithVolumeChange([
      session({ id: '1', date: '2026-01-01', cycleWeek: 1, totalVolume: 4000 }),
      session({ id: '2', date: '2026-02-01', cycleWeek: 1, totalVolume: 4200 }),
    ]);

    assert.equal(enriched[0].volumeChangePercent, null);
    assert.equal(enriched[1].volumeChangePercent, 5);
  });
});

describe('buildCycleRunGroups', () => {
  it('includes empty weeks in cycle', () => {
    const enriched = enrichSessionsWithVolumeChange([
      session({ id: '1', date: '2026-01-01', cycleWeek: 1 }),
      session({ id: '2', date: '2026-01-15', cycleWeek: 3 }),
    ]);

    const groups = buildCycleRunGroups(enriched, 4, [4]);
    assert.equal(groups.length, 1);
    assert.equal(groups[0].weeks.length, 4);
    assert.equal(groups[0].weeks[0].isEmpty, false);
    assert.equal(groups[0].weeks[1].isEmpty, true);
    assert.equal(groups[0].weeks[2].isEmpty, false);
    assert.equal(groups[0].weeks[3].isDeload, true);
  });
});

describe('buildInferredCycleWeekBySession', () => {
  it('infers advancing weeks when stored cycle week is stuck at 1', () => {
    const summaries = enrichSessionsWithVolumeChange([
      session({ id: 's1', date: '2026-04-29', cycleWeek: 1, cycleWeeks: 4 }),
      session({ id: 's2', date: '2026-05-05', cycleWeek: 1, cycleWeeks: 4 }),
      session({ id: 's3', date: '2026-05-08', cycleWeek: 1, cycleWeeks: 4 }),
      session({ id: 's4', date: '2026-05-18', cycleWeek: 1, cycleWeeks: 4 }),
    ]);

    const map = buildInferredCycleWeekBySession(summaries);

    assert.equal(map.get('s1')?.displayWeek, 1);
    assert.equal(map.get('s1')?.inferred, false);
    assert.equal(map.get('s2')?.displayWeek, 2);
    assert.equal(map.get('s2')?.inferred, true);
    assert.equal(map.get('s3')?.displayWeek, 2);
    assert.equal(map.get('s4')?.displayWeek, 3);
  });

  it('uses stored week when athlete app advances correctly', () => {
    const summaries = enrichSessionsWithVolumeChange([
      session({ id: 's1', date: '2026-01-01', cycleWeek: 1, cycleWeeks: 4 }),
      session({ id: 's2', date: '2026-01-08', cycleWeek: 2, cycleWeeks: 4 }),
    ]);

    const map = buildInferredCycleWeekBySession(summaries);

    assert.equal(map.get('s2')?.displayWeek, 2);
    assert.equal(map.get('s2')?.inferred, false);
  });
});

describe('resolveDisplaySetIndex', () => {
  it('returns 1-based index when all set_index values are zero', () => {
    const sets = [
      { id: '1', set_index: 0, weight_used: 100, reps_completed: 5, rpe: 7 },
      { id: '2', set_index: 0, weight_used: 100, reps_completed: 5, rpe: 7 },
    ];

    assert.equal(resolveDisplaySetIndex(sets, 0), 1);
    assert.equal(resolveDisplaySetIndex(sets, 1), 2);
  });
});

describe('buildExerciseHistory', () => {
  it('groups sets by exercise in chronological order', () => {
    const summaries = enrichSessionsWithVolumeChange([
      session({ id: 's1', date: '2026-01-01', cycleWeek: 1, totalVolume: 4000 }),
      session({ id: 's2', date: '2026-01-08', cycleWeek: 2, totalVolume: 4200 }),
    ]);

    const exercises = buildExerciseHistory(
      [
        {
          id: 's1',
          date: '2026-01-01',
          duration: 3600,
          total_volume: 4000,
          feeling: null,
          rpe_average: 7,
          heart_rate_avg: null,
          heart_rate_max: null,
          workout_id: 'workout-1',
          cycle_week: 1,
          session_exercises: [
            {
              id: 'ex1',
              name: 'Penkkipunnerrus',
              order_index: 0,
              exercise_id: 'e1',
              is_ad_hoc: false,
              session_sets: [
                { id: 'set1', set_index: 1, weight_used: 80, reps_completed: 8, rpe: 7 },
                { id: 'set2', set_index: 2, weight_used: 80, reps_completed: 7, rpe: 7.5 },
              ],
            },
          ],
        },
        {
          id: 's2',
          date: '2026-01-08',
          duration: 3600,
          total_volume: 4200,
          feeling: null,
          rpe_average: 8,
          heart_rate_avg: null,
          heart_rate_max: null,
          workout_id: 'workout-1',
          cycle_week: 2,
          session_exercises: [
            {
              id: 'ex2',
              name: 'Penkkipunnerrus',
              order_index: 0,
              exercise_id: 'e1',
              is_ad_hoc: false,
              session_sets: [
                { id: 'set3', set_index: 1, weight_used: 85, reps_completed: 6, rpe: 8 },
              ],
            },
          ],
        },
      ],
      summaries,
      [{ id: 'e1', name: 'Penkkipunnerrus', order_index: 0 }],
    );

    assert.equal(exercises.length, 1);
    assert.equal(exercises[0].name, 'Penkkipunnerrus');
    assert.equal(exercises[0].rows.length, 3);
    assert.equal(exercises[0].sessionCount, 2);
    assert.equal(exercises[0].rows[0].cycleWeek, 1);
    assert.equal(exercises[0].rows[2].cycleWeek, 2);
    assert.equal(exercises[0].rows[2].weightUsed, 85);
    assert.equal(exercises[0].rows[2].cycleWeek, 2);
    assert.equal(exercises[0].isProgramExercise, true);
  });

  it('marks ad-hoc exercises as non-program', () => {
    const summaries = enrichSessionsWithVolumeChange([
      session({ id: 's1', date: '2026-01-01', cycleWeek: 1 }),
    ]);

    const exercises = buildExerciseHistory(
      [
        {
          id: 's1',
          date: '2026-01-01',
          duration: 3600,
          total_volume: 4000,
          feeling: null,
          rpe_average: 7,
          heart_rate_avg: null,
          heart_rate_max: null,
          workout_id: 'workout-1',
          cycle_week: 1,
          session_exercises: [
            {
              id: 'ex1',
              name: 'Penkkipunnerrus',
              order_index: 0,
              exercise_id: 'e1',
              is_ad_hoc: false,
              session_sets: [
                { id: 'set1', set_index: 1, weight_used: 80, reps_completed: 8, rpe: 7 },
              ],
            },
            {
              id: 'ex2',
              name: 'Hauiskurlaus',
              order_index: 1,
              exercise_id: null,
              is_ad_hoc: true,
              session_sets: [
                { id: 'set2', set_index: 1, weight_used: 15, reps_completed: 12, rpe: 6 },
              ],
            },
          ],
        },
      ],
      summaries,
      [{ id: 'e1', name: 'Penkkipunnerrus', order_index: 0 }],
    );

    assert.equal(exercises.length, 2);
    assert.equal(
      exercises.find((exercise) => exercise.name === 'Penkkipunnerrus')?.isProgramExercise,
      true,
    );
    assert.equal(
      exercises.find((exercise) => exercise.name === 'Hauiskurlaus')?.isProgramExercise,
      false,
    );
  });
});

describe('buildWorkoutHistoryData', () => {
  it('uses flat timeline for single-week programs', () => {
    const data = buildWorkoutHistoryData(
      [
        session({ id: '1', date: '2026-01-01', cycleWeek: 1, cycleWeeks: 1 }),
        session({ id: '2', date: '2026-01-08', cycleWeek: 1, cycleWeeks: 1 }),
      ],
      {
        workoutId: 'workout-1',
        programName: 'Single',
        workoutType: 'strength',
        cycleWeeks: 1,
        programmedDeloads: [],
      },
    );

    assert.equal(data.isFlatTimeline, true);
    assert.equal(data.flatSessions.length, 2);
    assert.equal(data.cycleRuns.length, 0);
  });

  it('separates unscheduled sessions', () => {
    const data = buildWorkoutHistoryData(
      [
        session({ id: '1', date: '2026-01-01', cycleWeek: 1 }),
        session({ id: '2', date: '2026-01-08', cycleWeek: null }),
      ],
      {
        workoutId: 'workout-1',
        programName: 'Push A',
        workoutType: 'strength',
        cycleWeeks: 8,
        programmedDeloads: [],
      },
    );

    assert.equal(data.unscheduled.length, 1);
    assert.equal(data.unscheduled[0].id, '2');
  });
});
