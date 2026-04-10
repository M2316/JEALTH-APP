export interface MuscleGroup {
  id: string;
  name: string;
  nameKo: string;
}

export interface Exercise {
  id: string;
  name: string;
  equipment?: string;
  imageUrl?: string;
  muscleGroups: MuscleGroup[];
}

export type WeightUnit = 'kg' | 'lbs';

export interface WorkoutSet {
  id?: string;
  round: number;
  reps: number;
  weight: number;
  weightUnit: WeightUnit;
}

export interface WorkoutExercise {
  id?: string;
  exercise: Exercise;
  order: number;
  sets: WorkoutSet[];
}

export interface WorkoutRoutine {
  id?: string;
  date: string;
  order: number;
  exercises: WorkoutExercise[];
}

export interface CreateRoutinePayload {
  date: string;
  order?: number;
  exercises: {
    exerciseId: string;
    order: number;
    sets: {
      reps: number;
      weight: number;
      weightUnit?: WeightUnit;
    }[];
  }[];
}

// Stats types
export interface VolumeData {
  date: string;
  volume: number;
}

export interface PersonalRecord {
  name: string;
  maxWeight: number;
  date: string;
}

export interface MuscleBreakdownItem {
  muscleGroup: string;
  setCount: number;
}
