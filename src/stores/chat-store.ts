import { create } from 'zustand';

import {
  initChatDb,
  insertMessage,
  loadMessagesForDate,
  updateMessageStatus,
  updateMessageDraft,
  getContextSinceLastApproved,
  discardPendingForDate,
} from '@/lib/chat-db';
import { sendChatWorkout, approveNewExerciseApi } from '@/lib/chat-api';
import { createRoutine, updateRoutine } from '@/lib/workout-api';
import { useWorkoutStore } from '@/stores/workout-store';
import { useExerciseStore } from '@/stores/exercise-store';
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
  parseSuccessByMsgId: Record<number, boolean>;

  openForDate: (date: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  approveDraft: (messageId: number) => Promise<void>;
  approveNewExercise: (
    messageId: number,
    input: { muscleGroupIds: string[]; equipment?: string; name: string },
  ) => Promise<void>;
  rejectNewExercise: (messageId: number) => Promise<void>;
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
  parseSuccessByMsgId: {},

  openForDate: async (date) => {
    await initChatDb();
    const messages = await loadMessagesForDate(date);
    set({
      currentDate: date,
      messages,
      isSending: false,
      confidenceByMsgId: {},
      parseSuccessByMsgId: {},
    });
  },

  sendMessage: async (text) => {
    console.log('[chat-store] sendMessage called', { textLen: text.length, currentDate: get().currentDate });
    const date = get().currentDate;
    if (!date) { console.warn('[chat-store] no currentDate, abort'); return; }
    const trimmed = text.trim();
    if (!trimmed) { console.warn('[chat-store] empty text, abort'); return; }

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
      const isNewExerciseKind = res.kind === 'new_exercise';
      const assistantId = await insertMessage({
        date,
        role: 'assistant',
        content: res.reply,
        draft: res.draft,
        status: 'pending',
        createdAt: assistantNow,
        kind: res.kind,
        muscleGroups: isNewExerciseKind ? res.muscleGroups : undefined,
        suggestedMuscleGroupIds: isNewExerciseKind ? res.suggestedMuscleGroupIds : undefined,
        originalName: isNewExerciseKind ? res.originalName : undefined,
        suggestedEquipment: isNewExerciseKind ? res.suggestedEquipment : undefined,
      });
      const assistantMessage: ChatMessage = {
        id: assistantId,
        date,
        role: 'assistant',
        content: res.reply,
        draft: res.draft,
        status: 'pending',
        createdAt: assistantNow,
        kind: res.kind,
        muscleGroups: isNewExerciseKind ? res.muscleGroups : undefined,
        suggestedMuscleGroupIds: isNewExerciseKind ? res.suggestedMuscleGroupIds : undefined,
        originalName: isNewExerciseKind ? res.originalName : undefined,
        suggestedEquipment: isNewExerciseKind ? res.suggestedEquipment : undefined,
      };
      set((s) => ({
        messages: [...s.messages, assistantMessage],
        isSending: false,
        confidenceByMsgId: {
          ...s.confidenceByMsgId,
          [assistantId]: res.confidence,
        },
        parseSuccessByMsgId: {
          ...s.parseSuccessByMsgId,
          // 서버가 parseSuccess 안 주는 구버전 호환: confidence high && exercises 존재하면 true
          [assistantId]: typeof res.parseSuccess === 'boolean'
            ? res.parseSuccess
            : (res.confidence === 'high' && res.draft.exercises.length > 0),
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

    // 해당 날짜에 이미 routine 이 있으면 거기에 운동을 추가(append)하고,
    // 없으면 새 routine 생성. 덮어쓰기 방지.
    const workoutState = useWorkoutStore.getState();
    const existingForDate = workoutState.routines.find(
      (r) => r.date === date && r.id,
    );

    let routine;
    let routineId: string;

    if (existingForDate && existingForDate.id) {
      // 기존 routine 의 exercises 에 draft 의 exercises 를 append
      const existingExercises = existingForDate.exercises ?? [];
      const baseOrder = existingExercises.length;
      const newExercises = msg.draft.exercises.map((ex, idx) => ({
        exerciseId: ex.exerciseId,
        order: baseOrder + idx,
        sets: ex.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          weightUnit: s.weightUnit,
        })),
      }));
      const mergedExercises = [
        ...existingExercises.map((ex, idx) => ({
          exerciseId: ex.exercise?.id ?? '',
          order: idx,
          sets: (ex.sets ?? []).map((s) => ({
            reps: s.reps,
            weight: s.weight,
            weightUnit: s.weightUnit,
          })),
        })),
        ...newExercises,
      ];
      routine = await updateRoutine(existingForDate.id, {
        date,
        exercises: mergedExercises,
      });
      routineId = routine?.id ?? existingForDate.id;
    } else {
      const payload = draftToPayload(date, msg.draft);
      routine = await createRoutine(payload);
      routineId = routine?.id ?? '';
    }

    await updateMessageStatus(messageId, 'saved', routineId);

    try {
      if (workoutState.selectedDate === date) {
        // 해당 date 의 routine 을 방금 받은 서버 응답으로 교체 (동일 id)
        const updatedRoutines = existingForDate
          ? workoutState.routines.map((r) => (r.id === routine?.id ? routine : r))
          : [...workoutState.routines, routine];
        useWorkoutStore.setState({ routines: updatedRoutines });
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

  approveNewExercise: async (messageId, input) => {
    const state = get();
    const date = state.currentDate;
    if (!date) return;
    const msg = state.messages.find((m) => m.id === messageId);
    if (!msg || !msg.draft || msg.kind !== 'new_exercise') return;
    const draftExercise = msg.draft.exercises[0];
    if (!draftExercise) return;

    try {
      const res = await approveNewExerciseApi({
        date,
        name: input.name,
        muscleGroupIds: input.muscleGroupIds,
        equipment: input.equipment,
        sets: draftExercise.sets.map((s) => ({
          round: s.round,
          reps: s.reps,
          weight: s.weight,
          weightUnit: s.weightUnit,
        })),
      });

      // exercise-store 캐시에 새 운동 추가 (기존 중복 제거 후 앞에 삽입)
      try {
        const exStore = useExerciseStore.getState();
        useExerciseStore.setState({
          exercises: [
            res.exercise,
            ...exStore.exercises.filter((e) => e.id !== res.exercise.id),
          ],
        });
      } catch {
        // ignore store sync errors in tests
      }

      // workout-store 동기화
      try {
        const workoutState = useWorkoutStore.getState();
        if (workoutState.selectedDate === date) {
          const idx = workoutState.routines.findIndex((r) => r.id === res.routine.id);
          const updatedRoutines =
            idx >= 0
              ? workoutState.routines.map((r) =>
                  r.id === res.routine.id ? res.routine : r,
                )
              : [...workoutState.routines, res.routine];
          useWorkoutStore.setState({ routines: updatedRoutines });
        }
      } catch {
        // ignore
      }

      // 메시지 draft.exerciseId 를 실제 id 로 patch (DB + 메모리)
      const patchedDraft: AssistantDraft = {
        exercises: msg.draft.exercises.map((e, i) =>
          i === 0 ? { ...e, exerciseId: res.exercise.id, name: input.name } : e,
        ),
      };
      await updateMessageDraft(messageId, patchedDraft);
      await updateMessageStatus(messageId, 'saved', res.routine.id);

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
          .map((m) =>
            m.id === messageId
              ? { ...m, status: 'saved' as const, routineId: res.routine.id, draft: patchedDraft }
              : m,
          )
          .concat(followupMsg),
      }));
    } catch (err) {
      console.error('[chat-store] approveNewExercise failed', err);
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
      }));
    }
  },

  rejectNewExercise: async (messageId) => {
    await updateMessageStatus(messageId, 'discarded');
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === messageId ? { ...m, status: 'discarded' as const } : m,
      ),
    }));
  },

  closeAndCleanup: async () => {
    // pending draft 는 의도적으로 유지: 사용자가 sheet 를 닫았다가 다시 열어도
    // 미승인 초안에 승인 버튼을 다시 눌러 저장할 수 있도록 한다.
    set({
      currentDate: null,
      messages: [],
      isSending: false,
      confidenceByMsgId: {},
      parseSuccessByMsgId: {},
    });
  },
}));
