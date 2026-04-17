import {
  computeDailyMetrics,
  computeWeeklyTotal,
  computeWeekOverWeek,
  formatK,
} from './dashboard-metrics';
import type { WorkoutRoutine, VolumeData } from '@/types/workout';

function makeRoutine(exercises: { sets: { reps: number; weight: number; weightUnit?: 'kg' | 'lbs' }[] }[]): WorkoutRoutine {
  return {
    date: '2026-04-16',
    order: 0,
    exercises: exercises.map((ex, i) => ({
      order: i + 1,
      exercise: { id: `ex-${i}`, name: `Ex${i}`, muscleGroups: [] },
      sets: ex.sets.map((s, si) => ({
        round: si + 1,
        reps: s.reps,
        weight: s.weight,
        weightUnit: s.weightUnit ?? 'kg',
      })),
    })),
  };
}

describe('computeDailyMetrics', () => {
  it('empty routines → all zero', () => {
    expect(computeDailyMetrics([])).toEqual({ setCount: 0, volumeKg: 0, estimatedMinutes: 0 });
  });

  it('single routine × 1 exercise × 2 sets (10×50kg) = 1000 volume, 2 sets, 6 min', () => {
    const r = makeRoutine([{ sets: [{ reps: 10, weight: 50 }, { reps: 10, weight: 50 }] }]);
    expect(computeDailyMetrics([r])).toEqual({ setCount: 2, volumeKg: 1000, estimatedMinutes: 6 });
  });

  it('lbs converted: 10 reps × 100 lbs ≈ 453.6 kg', () => {
    const r = makeRoutine([{ sets: [{ reps: 10, weight: 100, weightUnit: 'lbs' }] }]);
    const m = computeDailyMetrics([r]);
    expect(m.setCount).toBe(1);
    expect(m.volumeKg).toBeCloseTo(453.6, 1);
    expect(m.estimatedMinutes).toBe(3);
  });

  it('handles NaN/undefined reps and weight as zero', () => {
    const r: WorkoutRoutine = {
      date: '2026-04-16', order: 0,
      exercises: [{
        order: 1,
        exercise: { id: 'x', name: 'X', muscleGroups: [] },
        sets: [{ round: 1, reps: Number.NaN, weight: Number.NaN, weightUnit: 'kg' }],
      }],
    };
    const m = computeDailyMetrics([r]);
    expect(m.setCount).toBe(1);
    expect(m.volumeKg).toBe(0);
  });
});

describe('computeWeeklyTotal', () => {
  it('empty → 0', () => {
    expect(computeWeeklyTotal([])).toBe(0);
  });

  it('sums volume field', () => {
    const data: VolumeData[] = [
      { date: '2026-04-10', volume: 1000 },
      { date: '2026-04-11', volume: 500 },
      { date: '2026-04-12', volume: 250.5 },
    ];
    expect(computeWeeklyTotal(data)).toBe(1750.5);
  });
});

describe('computeWeekOverWeek', () => {
  it('returns 0 when last week is empty (division guard)', () => {
    expect(computeWeekOverWeek([{ date: '2026-04-10', volume: 1000 }], [])).toBe(0);
  });

  it('+50% when this=1500, last=1000', () => {
    const tw: VolumeData[] = [{ date: '2026-04-10', volume: 1500 }];
    const lw: VolumeData[] = [{ date: '2026-04-03', volume: 1000 }];
    expect(computeWeekOverWeek(tw, lw)).toBe(50);
  });

  it('-25% when this=750, last=1000', () => {
    const tw: VolumeData[] = [{ date: '2026-04-10', volume: 750 }];
    const lw: VolumeData[] = [{ date: '2026-04-03', volume: 1000 }];
    expect(computeWeekOverWeek(tw, lw)).toBe(-25);
  });
});

describe('formatK', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [999.6, '1000'],
    [1000, '1.0K'],
    [1500, '1.5K'],
    [12340, '12.3K'],
  ])('formatK(%p) → %p', (input, expected) => {
    expect(formatK(input)).toBe(expected);
  });
});
