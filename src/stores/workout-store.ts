import { create } from 'zustand';

import { todayString } from '@/lib/date';
import {
  fetchRoutinesByDate,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  copyRoutine,
  reorderExercises,
  reorderSets,
} from '@/lib/workout-api';
import type { WorkoutRoutine, CreateRoutinePayload, Exercise } from '@/types/workout';

interface WorkoutState {
  selectedDate: string;
  routines: WorkoutRoutine[];
  isLoading: boolean;
  pendingExerciseToAdd: Exercise | null;

  setDate: (date: string) => void;
  loadRoutines: () => Promise<void>;
  addRoutine: (data: CreateRoutinePayload) => Promise<WorkoutRoutine>;
  updateRoutine: (
    id: string,
    data: Partial<CreateRoutinePayload>,
  ) => Promise<WorkoutRoutine>;
  deleteRoutine: (id: string) => Promise<void>;
  copyFromRoutine: (sourceId: string) => Promise<WorkoutRoutine>;
  reorderExercises: (routineId: string, orderedIds: string[]) => Promise<void>;
  reorderSets: (
    routineId: string,
    exerciseId: string,
    orderedIds: string[],
  ) => Promise<void>;
  setPendingExerciseToAdd: (e: Exercise | null) => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  selectedDate: todayString(),
  routines: [],
  isLoading: false,
  pendingExerciseToAdd: null,

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

  reorderExercises: async (routineId, orderedIds) => {
    const prev = get().routines;
    const optimistic = prev.map((r) => {
      if (r.id !== routineId) return r;
      const byId = new Map(r.exercises.map((e) => [e.id, e] as const));
      const nextExercises = orderedIds
        .map((id, i) => {
          const e = byId.get(id);
          return e ? { ...e, order: i } : null;
        })
        .filter((e): e is NonNullable<typeof e> => e !== null);
      return { ...r, exercises: nextExercises };
    });
    set({ routines: optimistic });
    try {
      const updated = await reorderExercises(routineId, orderedIds);
      set((state) => ({
        routines: state.routines.map((r) => (r.id === routineId ? updated : r)),
      }));
    } catch (err) {
      set({ routines: prev });
      throw err;
    }
  },

  reorderSets: async (routineId, exerciseId, orderedIds) => {
    const prev = get().routines;
    const optimistic = prev.map((r) => {
      if (r.id !== routineId) return r;
      return {
        ...r,
        exercises: r.exercises.map((e) => {
          if (e.id !== exerciseId) return e;
          const byId = new Map(e.sets.map((s) => [s.id, s] as const));
          const nextSets = orderedIds
            .map((id, i) => {
              const s = byId.get(id);
              return s ? { ...s, round: i + 1 } : null;
            })
            .filter((s): s is NonNullable<typeof s> => s !== null);
          return { ...e, sets: nextSets };
        }),
      };
    });
    set({ routines: optimistic });
    try {
      const updated = await reorderSets(routineId, exerciseId, orderedIds);
      set((state) => ({
        routines: state.routines.map((r) => (r.id === routineId ? updated : r)),
      }));
    } catch (err) {
      set({ routines: prev });
      throw err;
    }
  },

  setPendingExerciseToAdd: (e) => {
    set({ pendingExerciseToAdd: e });
  },
}));
