import { api } from './api';
import type {
  ChatWorkoutRequest,
  ChatWorkoutResponse,
} from '@/types/chat';
import type { Exercise, WorkoutRoutine, WeightUnit } from '@/types/workout';

export function sendChatWorkout(
  payload: ChatWorkoutRequest,
): Promise<ChatWorkoutResponse> {
  return api<ChatWorkoutResponse>('/chat/workout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface ApproveNewExercisePayload {
  date: string;
  name: string;
  muscleGroupIds: string[];
  equipment?: string;
  sets: Array<{
    round: number;
    reps: number;
    weight: number;
    weightUnit: WeightUnit;
  }>;
}

export interface ApproveNewExerciseResponse {
  exercise: Exercise;
  routine: WorkoutRoutine;
}

export function approveNewExerciseApi(
  payload: ApproveNewExercisePayload,
): Promise<ApproveNewExerciseResponse> {
  return api<ApproveNewExerciseResponse>('/chat/workout/approve-new-exercise', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
