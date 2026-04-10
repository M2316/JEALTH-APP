import { create } from 'zustand';
import {
  fetchVolume,
  fetchRecords,
  fetchMuscleBreakdown,
} from '@/lib/stats-api';
import type {
  VolumeData,
  PersonalRecord,
  MuscleBreakdownItem,
} from '@/types/workout';

export type Period = 'week' | 'month' | 'year';

interface StatsState {
  period: Period;
  volumeData: VolumeData[];
  personalRecords: PersonalRecord[];
  muscleBreakdown: MuscleBreakdownItem[];
  isLoading: boolean;

  setPeriod: (p: Period) => void;
  loadStats: () => Promise<void>;
}

function getDateRange(period: Period): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  start.setDate(end.getDate() - days);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export const useStatsStore = create<StatsState>((set, get) => ({
  period: 'week',
  volumeData: [],
  personalRecords: [],
  muscleBreakdown: [],
  isLoading: false,

  setPeriod: (p) => {
    set({ period: p });
    get().loadStats();
  },

  loadStats: async () => {
    set({ isLoading: true });
    try {
      const { start, end } = getDateRange(get().period);
      const [volumeData, personalRecords, muscleBreakdown] = await Promise.all([
        fetchVolume(start, end),
        fetchRecords(),
        fetchMuscleBreakdown(start, end),
      ]);
      set({ volumeData, personalRecords, muscleBreakdown });
    } catch {
      // keep existing data on error
    } finally {
      set({ isLoading: false });
    }
  },
}));
