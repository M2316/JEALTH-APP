import { create } from 'zustand';

import {
  fetchRoutinesByDate,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  copyRoutine,
} from '@/lib/workout-api';
import type { WorkoutRoutine, CreateRoutinePayload } from '@/types/workout';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface WorkoutState {
  selectedDate: string;
  routines: WorkoutRoutine[];
  isLoading: boolean;

  setDate: (date: string) => void;
  loadRoutines: () => Promise<void>;
  addRoutine: (data: CreateRoutinePayload) => Promise<WorkoutRoutine>;
  updateRoutine: (
    id: string,
    data: Partial<CreateRoutinePayload>,
  ) => Promise<WorkoutRoutine>;
  deleteRoutine: (id: string) => Promise<void>;
  copyFromRoutine: (sourceId: string) => Promise<WorkoutRoutine>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  selectedDate: todayString(),
  routines: [],
  isLoading: false,

  setDate: (date) => {
    set({ selectedDate: date });
  },

  loadRoutines: async () => {
    const { selectedDate } = get();
    set({ isLoading: true });
    try {
      const routines = await fetchRoutinesByDate(selectedDate);
      set({ routines, isLoading: false });
    } catch {
      set({ routines: [], isLoading: false });
    }
  },

  addRoutine: async (data) => {
    const routine = await createRoutine(data);
    set((state) => ({ routines: [...state.routines, routine] }));
    return routine;
  },

  updateRoutine: async (id, data) => {
    const routine = await updateRoutine(id, data);
    set((state) => ({
      routines: state.routines.map((r) => (r.id === id ? routine : r)),
    }));
    return routine;
  },

  deleteRoutine: async (id) => {
    await deleteRoutine(id);
    set((state) => ({
      routines: state.routines.filter((r) => r.id !== id),
    }));
  },

  copyFromRoutine: async (sourceId) => {
    const { selectedDate } = get();
    const routine = await copyRoutine(sourceId, selectedDate);
    set((state) => ({ routines: [...state.routines, routine] }));
    return routine;
  },
}));
