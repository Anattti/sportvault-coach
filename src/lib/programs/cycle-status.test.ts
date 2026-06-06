import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  resolveActiveProgramMeta,
  resolveCycleStatus,
} from './cycle-status';

describe('resolveActiveProgramMeta', () => {
  it('prefers assignment over managed workout and session', () => {
    const meta = resolveActiveProgramMeta(
      { program: 'Assignment', cycle_weeks: 8, programmed_deloads: [4] },
      { program: 'Managed', cycle_weeks: 6, programmed_deloads: [3] },
      { program: 'Session', cycle_weeks: 4, programmed_deloads: [2] },
    );

    assert.equal(meta.program, 'Assignment');
    assert.equal(meta.cycle_weeks, 8);
    assert.deepEqual(meta.programmed_deloads, [4]);
  });

  it('falls back field-by-field when assignment lacks program name', () => {
    const meta = resolveActiveProgramMeta(
      { program: null, cycle_weeks: 8, programmed_deloads: [4] },
      { program: 'Managed', cycle_weeks: 6, programmed_deloads: [3] },
      null,
    );

    assert.equal(meta.program, 'Managed');
    assert.equal(meta.cycle_weeks, 8);
    assert.deepEqual(meta.programmed_deloads, [4]);
  });
});

describe('resolveCycleStatus', () => {
  it('marks deload week and hasCycle when multi-week program has sessions', () => {
    const status = resolveCycleStatus(
      [
        {
          date: '2026-06-02T10:00:00.000Z',
          cycle_week: 4,
          workout_id: 'workout-1',
        },
      ],
      {
        program: 'Strength Block',
        cycle_weeks: 8,
        programmed_deloads: [4, 8],
      },
    );

    assert.equal(status.currentWeek, 4);
    assert.equal(status.totalWeeks, 8);
    assert.equal(status.isDeloadWeek, true);
    assert.equal(status.hasCycle, true);
    assert.equal(status.programStuck, false);
  });

  it('returns hasCycle false for single-week programs', () => {
    const status = resolveCycleStatus(
      [
        {
          date: '2026-06-02T10:00:00.000Z',
          cycle_week: 1,
          workout_id: 'workout-1',
        },
      ],
      {
        program: 'Single Week',
        cycle_weeks: 1,
        programmed_deloads: [],
      },
    );

    assert.equal(status.hasCycle, false);
  });

  it('detects program stuck when cycle week does not advance', () => {
    const status = resolveCycleStatus(
      [
        {
          date: '2026-06-09T10:00:00.000Z',
          cycle_week: 2,
          workout_id: 'workout-1',
        },
        {
          date: '2026-06-02T10:00:00.000Z',
          cycle_week: 2,
          workout_id: 'workout-1',
        },
      ],
      {
        program: 'Strength Block',
        cycle_weeks: 8,
        programmed_deloads: [],
      },
    );

    assert.equal(status.currentWeek, 2);
    assert.equal(status.programStuck, true);
  });

  it('returns hasCycle false when there are no sessions', () => {
    const status = resolveCycleStatus(
      [],
      {
        program: 'Strength Block',
        cycle_weeks: 8,
        programmed_deloads: [4],
      },
    );

    assert.equal(status.currentWeek, null);
    assert.equal(status.hasCycle, false);
  });
});
