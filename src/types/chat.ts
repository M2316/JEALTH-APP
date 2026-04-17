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
  /**
   * AI 가 메시지를 운동 기록으로 정확히 파싱했는지 여부.
   * true: 승인 버튼 노출. false: 승인 불가, 재입력 안내.
   */
  parseSuccess: boolean;
  draft: AssistantDraft;
  candidates?: Array<{ id: string; name: string }>;
}

export interface ChatWorkoutRequest {
  date: string;
  messages: Array<{ role: ChatRole; content: string }>;
}

export type DraftToRoutinePayload = (date: string, draft: AssistantDraft) => CreateRoutinePayload;
