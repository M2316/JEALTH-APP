import { api } from './api';
import type { ChatWorkoutRequest, ChatWorkoutResponse } from '@/types/chat';

export function sendChatWorkout(
  payload: ChatWorkoutRequest,
): Promise<ChatWorkoutResponse> {
  return api<ChatWorkoutResponse>('/chat/workout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
