import { create } from 'zustand';

import {
  initChatDb,
  insertMessage,
  loadMessagesForDate,
  updateMessageStatus,
  getContextSinceLastApproved,
  discardPendingForDate,
} from '@/lib/chat-db';
import { sendChatWorkout } from '@/lib/chat-api';
import { createRoutine } from '@/lib/workout-api';
import { useWorkoutStore } from '@/stores/workout-store';
import type {
  AssistantDraft,
  ChatMessage,
} from '@/types/chat';
import type { CreateRoutinePayload } from '@/types/workout';

interface ChatState {
  currentDate: string | null;
  messages: ChatMessage[];
  isSending: boolean;
  confidenceByMsgId: Record<number, 'high' | 'low'>;

  openForDate: (date: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  approveDraft: (messageId: number) => Promise<void>;
  retryFromError: (errorMessageId: number) => Promise<void>;
  closeAndCleanup: () => Promise<void>;
}

const draftToPayload = (date: string, draft: AssistantDraft): CreateRoutinePayload => ({
  date,
  exercises: draft.exercises.map((ex, idx) => ({
    exerciseId: ex.exerciseId,
    order: idx,
    sets: ex.sets.map((s) => ({
      reps: s.reps,
      weight: s.weight,
      weightUnit: s.weightUnit,
    })),
  })),
});

export const useChatStore = create<ChatState>((set, get) => ({
  currentDate: null,
  messages: [],
  isSending: false,
  confidenceByMsgId: {},

  openForDate: async (date) => {
    await initChatDb();
    const messages = await loadMessagesForDate(date);
    set({
      currentDate: date,
      messages,
      isSending: false,
      confidenceByMsgId: {},
    });
  },

  sendMessage: async (text) => {
    const date = get().currentDate;
    if (!date) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    const userId = await insertMessage({
      date,
      role: 'user',
      content: trimmed,
      status: 'saved',
      createdAt: now,
    });
    const userMessage: ChatMessage = {
      id: userId,
      date,
      role: 'user',
      content: trimmed,
      status: 'saved',
      createdAt: now,
    };
    set((s) => ({ messages: [...s.messages, userMessage], isSending: true }));

    try {
      const context = await getContextSinceLastApproved(date);
      const res = await sendChatWorkout({ date, messages: context });

      const assistantNow = Date.now();
      const assistantId = await insertMessage({
        date,
        role: 'assistant',
        content: res.reply,
        draft: res.draft,
        status: 'pending',
        createdAt: assistantNow,
      });
      const assistantMessage: ChatMessage = {
        id: assistantId,
        date,
        role: 'assistant',
        content: res.reply,
        draft: res.draft,
        status: 'pending',
        createdAt: assistantNow,
      };
      set((s) => ({
        messages: [...s.messages, assistantMessage],
        isSending: false,
        confidenceByMsgId: {
          ...s.confidenceByMsgId,
          [assistantId]: res.confidence,
        },
      }));
    } catch (err) {
      const errorNow = Date.now();
      const message = err instanceof Error ? err.message : '요청 실패';
      const errorId = await insertMessage({
        date,
        role: 'assistant',
        content: message,
        status: 'error',
        createdAt: errorNow,
      });
      const errorMessage: ChatMessage = {
        id: errorId,
        date,
        role: 'assistant',
        content: message,
        status: 'error',
        createdAt: errorNow,
      };
      set((s) => ({
        messages: [...s.messages, errorMessage],
        isSending: false,
      }));
    }
  },

  approveDraft: async (messageId) => {
    const date = get().currentDate;
    if (!date) return;
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg || !msg.draft) return;

    const payload = draftToPayload(date, msg.draft);
    const routine = await createRoutine(payload);
    const routineId = routine?.id ?? '';

    await updateMessageStatus(messageId, 'saved', routineId);

    try {
      const workoutState = useWorkoutStore.getState();
      if (workoutState.selectedDate === date) {
        useWorkoutStore.setState({ routines: [...workoutState.routines, routine] });
      }
    } catch {
      // ignore store sync errors in tests
    }

    const followupNow = Date.now();
    const followupText = '저장했어요. 다른 운동도 추가할까요?';
    const followupId = await insertMessage({
      date,
      role: 'assistant',
      content: followupText,
      status: 'saved',
      createdAt: followupNow,
    });
    const followupMsg: ChatMessage = {
      id: followupId,
      date,
      role: 'assistant',
      content: followupText,
      status: 'saved',
      createdAt: followupNow,
    };

    set((s) => ({
      messages: s.messages
        .map((m) => (m.id === messageId ? { ...m, status: 'saved' as const, routineId } : m))
        .concat(followupMsg),
    }));
  },

  retryFromError: async (errorMessageId) => {
    const messages = get().messages;
    const errorIdx = messages.findIndex((m) => m.id === errorMessageId);
    if (errorIdx < 0) return;

    let userMsg: ChatMessage | null = null;
    for (let i = errorIdx - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        userMsg = messages[i];
        break;
      }
    }
    if (!userMsg) return;

    await updateMessageStatus(errorMessageId, 'discarded');
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === errorMessageId ? { ...m, status: 'discarded' as const } : m,
      ),
    }));

    await get().sendMessage(userMsg.content);
  },

  closeAndCleanup: async () => {
    const date = get().currentDate;
    if (date) {
      await discardPendingForDate(date);
    }
    set({
      currentDate: null,
      messages: [],
      isSending: false,
      confidenceByMsgId: {},
    });
  },
}));
