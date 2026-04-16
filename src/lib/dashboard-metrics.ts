import type { VolumeData, WorkoutRoutine } from '@/types/workout';

const LBS_TO_KG = 0.4536;
const MIN_PER_SET = 3;

export interface DailyMetrics {
  setCount: number;
  volumeKg: number;
  estimatedMinutes: number;
}

function safeNum(n: unknown): number {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
}

export function computeDailyMetrics(routines: WorkoutRoutine[]): DailyMetrics {
  let setCount = 0;
  let volumeKg = 0;
  for (const routine of routines) {
    for (const ex of routine.exercises) {
      for (const set of ex.sets) {
        setCount += 1;
        const reps = safeNum(set.reps);
        const raw = safeNum(set.weight);
        const kg = set.weightUnit === 'lbs' ? raw * LBS_TO_KG : raw;
        volumeKg += reps * kg;
      }
    }
  }
  return {
    setCount,
    volumeKg,
    estimatedMinutes: setCount * MIN_PER_SET,
  };
}

export function computeWeeklyTotal(data: VolumeData[]): number {
  return data.reduce((sum, d) => sum + safeNum(d.volume), 0);
}

export function computeWeekOverWeek(
  thisWeek: VolumeData[],
  lastWeek: VolumeData[],
): number {
  const a = computeWeeklyTotal(thisWeek);
  const b = computeWeeklyTotal(lastWeek);
  if (b === 0) return 0;
  return Math.round(((a - b) / b) * 100);
}

export function formatK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}
