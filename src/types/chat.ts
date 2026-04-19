import type { CreateRoutinePayload, WeightUnit } from './workout';

export type ChatRole = 'user' | 'assistant';
export type ChatStatus = 'pending' | 'saved' | 'discarded' | 'error';
export type ChatDraftKind = 'existing' | 'new_exercise';

export interface AssistantDraftSet {
  round: number;
  reps: number;
  weight: number;
  weightUnit: WeightUnit;
}

export interface AssistantDraftExercise {
  exerciseId: string;
  name: string;
  sets: AssistantDraftSet[];
}

export interface AssistantDraft {
  exercises: AssistantDraftExercise[];
}

export interface ChatMuscleGroup {
  id: string;
  name: string;
  color?: string;
}

export interface ChatMessage {
  id: number;
  date: string;
  role: ChatRole;
  content: string;
  draft?: AssistantDraft;
  status: ChatStatus;
  routineId?: string;
  createdAt: number;
  kind?: ChatDraftKind;
  muscleGroups?: ChatMuscleGroup[];
  suggestedMuscleGroupIds?: string[];
  editedMuscleGroupIds?: string[];
}

export interface ChatWorkoutResponse {
  reply: string;
  confidence: 'high' | 'low';
  parseSuccess: boolean;
  kind: ChatDraftKind;
  draft: AssistantDraft;
  suggestedMuscleGroupIds?: string[];
  muscleGroups?: ChatMuscleGroup[];
}

export interface ChatWorkoutRequest {
  date: string;
  messages: Array<{ role: ChatRole; content: string }>;
}

export type DraftToRoutinePayload = (
  date: string,
  draft: AssistantDraft,
) => CreateRoutinePayload;
