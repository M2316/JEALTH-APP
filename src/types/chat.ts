import type { CreateRoutinePayload, WeightUnit } from './workout';

export type ChatRole = 'user' | 'assistant';
export type ChatStatus = 'pending' | 'saved' | 'discarded' | 'error';

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

export interface ChatMessage {
  id: number;
  date: string;
  role: ChatRole;
  content: string;
  draft?: AssistantDraft;
  status: ChatStatus;
  routineId?: string;
  createdAt: number;
}

export interface ChatWorkoutResponse {
  reply: string;
  confidence: 'high' | 'low';
  draft: AssistantDraft;
  candidates?: Array<{ id: string; name: string }>;
}

export interface ChatWorkoutRequest {
  date: string;
  messages: Array<{ role: ChatRole; content: string }>;
}

export type DraftToRoutinePayload = (date: string, draft: AssistantDraft) => CreateRoutinePayload;
