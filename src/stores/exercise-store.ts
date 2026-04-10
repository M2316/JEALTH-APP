import { create } from 'zustand';

import {
  fetchMuscleGroups,
  fetchExercises,
  createExercise,
  uploadExerciseImage,
} from '@/lib/workout-api';
import type { MuscleGroup, Exercise } from '@/types/workout';

interface ExerciseState {
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
  isLoading: boolean;

  loadMuscleGroups: () => Promise<void>;
  loadExercises: (search?: string) => Promise<void>;
  addExercise: (data: {
    name: string;
    equipment?: string;
    muscleGroupIds?: string[];
  }) => Promise<Exercise>;
  uploadImage: (id: string, uri: string) => Promise<Exercise>;
}

export const useExerciseStore = create<ExerciseState>((set) => ({
  muscleGroups: [],
  exercises: [],
  isLoading: false,

  loadMuscleGroups: async () => {
    try {
      const muscleGroups = await fetchMuscleGroups();
      set({ muscleGroups });
    } catch {
      // ignore
    }
  },

  loadExercises: async (search?: string) => {
    set({ isLoading: true });
    try {
      const exercises = await fetchExercises(search);
      set({ exercises, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addExercise: async (data) => {
    const exercise = await createExercise(data);
    set((state) => ({ exercises: [exercise, ...state.exercises] }));
    return exercise;
  },

  uploadImage: async (id, uri) => {
    const updated = await uploadExerciseImage(id, uri);
    set((state) => ({
      exercises: state.exercises.map((e) => (e.id === id ? updated : e)),
    }));
    return updated;
  },
}));
