import { __resetMockDb } from 'expo-sqlite';
import { useChatStore } from '../chat-store';
import * as chatApi from '@/lib/chat-api';
import * as workoutApi from '@/lib/workout-api';

jest.mock('@/lib/chat-api');
jest.mock('@/lib/workout-api');

const sendMock = chatApi.sendChatWorkout as jest.MockedFunction<typeof chatApi.sendChatWorkout>;
const createRoutineMock = workoutApi.createRoutine as jest.MockedFunction<typeof workoutApi.createRoutine>;
const approveNewExerciseMock = chatApi.approveNewExerciseApi as jest.MockedFunction<
  typeof chatApi.approveNewExerciseApi
>;

beforeEach(() => {
  __resetMockDb();
  sendMock.mockReset();
  createRoutineMock.mockReset();
  approveNewExerciseMock.mockReset();
  useChatStore.setState({ messages: [], isSending: false, currentDate: null, confidenceByMsgId: {} });
});

describe('chat-store', () => {
  it('sendMessage inserts user message, calls API, inserts assistant draft', async () => {
    sendMock.mockResolvedValue({
      reply: '맞나요?',
      confidence: 'high',
      parseSuccess: true,
      kind: 'existing',
      draft: {
        exercises: [{
          exerciseId: 'ex-1', name: '벤치프레스',
          sets: [{ round: 1, reps: 10, weight: 20, weightUnit: 'kg' }],
        }],
      },
    });
    await useChatStore.getState().openForDate('2026-04-18');
    await useChatStore.getState().sendMessage('벤치 1세트 10개 20kg');
    const messages = useChatStore.getState().messages;
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
    expect(messages[1].draft?.exercises[0].name).toBe('벤치프레스');
  });

  it('approveDraft saves routine and updates message status', async () => {
    sendMock.mockResolvedValue({
      reply: '맞나요?',
      confidence: 'high',
      parseSuccess: true,
      kind: 'existing',
      draft: {
        exercises: [{
          exerciseId: 'ex-1', name: 'x',
          sets: [{ round: 1, reps: 1, weight: 1, weightUnit: 'kg' }],
        }],
      },
    });
    createRoutineMock.mockResolvedValue({ id: 'r-1' } as any);
    await useChatStore.getState().openForDate('2026-04-18');
    await useChatStore.getState().sendMessage('x');
    const draftMsg = useChatStore.getState().messages.find((m) => m.role === 'assistant')!;
    await useChatStore.getState().approveDraft(draftMsg.id);
    const updated = useChatStore.getState().messages.find((m) => m.id === draftMsg.id);
    expect(updated?.status).toBe('saved');
    expect(updated?.routineId).toBe('r-1');
    expect(useChatStore.getState().messages.length).toBeGreaterThanOrEqual(3);
  });

  it('sendMessage marks assistant as error on API failure', async () => {
    sendMock.mockRejectedValue(new Error('network'));
    await useChatStore.getState().openForDate('2026-04-18');
    await useChatStore.getState().sendMessage('hi');
    const last = useChatStore.getState().messages.at(-1)!;
    expect(last.role).toBe('assistant');
    expect(last.status).toBe('error');
  });

  it('sendMessage persists kind, muscleGroups, suggestedMuscleGroupIds', async () => {
    sendMock.mockResolvedValue({
      reply: '스쿼트는 새 운동입니다...',
      confidence: 'high',
      parseSuccess: false,
      kind: 'new_exercise',
      draft: {
        exercises: [{
          exerciseId: '', name: '스쿼트',
          sets: [{ round: 1, reps: 10, weight: 100, weightUnit: 'kg' }],
        }],
      },
      suggestedMuscleGroupIds: ['mg-leg', 'mg-quad'],
      muscleGroups: [
        { id: 'mg-leg', name: '하체' },
        { id: 'mg-quad', name: '대퇴사두' },
        { id: 'mg-chest', name: '가슴' },
      ],
    });
    await useChatStore.getState().openForDate('2026-04-19');
    await useChatStore.getState().sendMessage('스쿼트 100kg 10개');
    const assistant = useChatStore.getState().messages.find((m) => m.role === 'assistant')!;
    expect(assistant.kind).toBe('new_exercise');
    expect(assistant.suggestedMuscleGroupIds).toEqual(['mg-leg', 'mg-quad']);
    expect(assistant.muscleGroups).toHaveLength(3);
  });

  it('approveNewExercise calls API, updates stores, marks message saved', async () => {
    sendMock.mockResolvedValue({
      reply: '스쿼트 신규 추가할까요?',
      confidence: 'high',
      parseSuccess: false,
      kind: 'new_exercise',
      draft: {
        exercises: [{
          exerciseId: '', name: '스쿼트',
          sets: [{ round: 1, reps: 10, weight: 100, weightUnit: 'kg' }],
        }],
      },
      suggestedMuscleGroupIds: ['mg-leg'],
      muscleGroups: [{ id: 'mg-leg', name: '하체' }],
    });
    approveNewExerciseMock.mockResolvedValue({
      exercise: {
        id: 'ex-new',
        name: '스쿼트',
        muscleGroups: [{ id: 'mg-leg', name: '하체', nameKo: '하체' }],
      } as any,
      routine: { id: 'r-new', date: '2026-04-19', order: 0, exercises: [] } as any,
    });
    await useChatStore.getState().openForDate('2026-04-19');
    await useChatStore.getState().sendMessage('스쿼트 100 10');
    const draftMsg = useChatStore.getState().messages.find((m) => m.role === 'assistant')!;
    await useChatStore.getState().approveNewExercise(draftMsg.id, {
      muscleGroupIds: ['mg-leg'],
      name: '스쿼트',
    });
    expect(approveNewExerciseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-04-19',
        name: '스쿼트',
        muscleGroupIds: ['mg-leg'],
        sets: [{ round: 1, reps: 10, weight: 100, weightUnit: 'kg' }],
      }),
    );
    const updated = useChatStore.getState().messages.find((m) => m.id === draftMsg.id)!;
    expect(updated.status).toBe('saved');
    expect(updated.routineId).toBe('r-new');
    expect(updated.draft?.exercises[0].exerciseId).toBe('ex-new');
    expect(useChatStore.getState().messages.length).toBeGreaterThanOrEqual(3);
  });

  it('approveNewExercise forwards equipment and chosen name to API', async () => {
    sendMock.mockResolvedValue({
      reply: '푸쉬업 맞나요?',
      confidence: 'high',
      parseSuccess: false,
      kind: 'new_exercise',
      draft: {
        exercises: [{
          exerciseId: '', name: '푸쉬업',
          sets: [{ round: 1, reps: 100, weight: 0, weightUnit: 'kg' }],
        }],
      },
      suggestedMuscleGroupIds: ['mg-chest'],
      muscleGroups: [{ id: 'mg-chest', name: '가슴' }],
      originalName: '푸귀업',
      suggestedEquipment: '맨몸',
    });
    approveNewExerciseMock.mockResolvedValue({
      exercise: { id: 'ex-new', name: '푸귀업', muscleGroups: [] } as any,
      routine: { id: 'r-new', date: '2026-04-19', order: 0, exercises: [] } as any,
    });
    await useChatStore.getState().openForDate('2026-04-19');
    await useChatStore.getState().sendMessage('푸귀업 100개 0키로');
    const draftMsg = useChatStore.getState().messages.find((m) => m.role === 'assistant')!;
    await useChatStore.getState().approveNewExercise(draftMsg.id, {
      muscleGroupIds: ['mg-chest'],
      equipment: '맨몸',
      name: '푸귀업',
    });
    expect(approveNewExerciseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '푸귀업',
        muscleGroupIds: ['mg-chest'],
        equipment: '맨몸',
      }),
    );
    const updated = useChatStore.getState().messages.find((m) => m.id === draftMsg.id)!;
    expect(updated.draft?.exercises[0].name).toBe('푸귀업');
    expect(updated.draft?.exercises[0].exerciseId).toBe('ex-new');
  });

  it('approveNewExercise inserts error message on API failure, leaves original pending', async () => {
    sendMock.mockResolvedValue({
      reply: '스쿼트 신규 추가할까요?',
      confidence: 'high',
      parseSuccess: false,
      kind: 'new_exercise',
      draft: {
        exercises: [{
          exerciseId: '', name: '스쿼트',
          sets: [{ round: 1, reps: 10, weight: 100, weightUnit: 'kg' }],
        }],
      },
      suggestedMuscleGroupIds: ['mg-leg'],
      muscleGroups: [{ id: 'mg-leg', name: '하체' }],
    });
    approveNewExerciseMock.mockRejectedValue(new Error('network'));
    await useChatStore.getState().openForDate('2026-04-19');
    await useChatStore.getState().sendMessage('스쿼트 100 10');
    const draftMsg = useChatStore.getState().messages.find((m) => m.role === 'assistant')!;
    await useChatStore.getState().approveNewExercise(draftMsg.id, {
      muscleGroupIds: ['mg-leg'],
      name: '스쿼트',
    });
    const latest = useChatStore.getState().messages;
    const errorMsg = latest[latest.length - 1];
    expect(errorMsg.status).toBe('error');
    expect(errorMsg.content).toMatch(/network/);
    const stillPending = latest.find((m) => m.id === draftMsg.id)!;
    expect(stillPending.status).toBe('pending');
  });

  it('sendMessage persists originalName and suggestedEquipment on new_exercise', async () => {
    sendMock.mockResolvedValue({
      reply: '푸쉬업 맞나요?',
      confidence: 'high',
      parseSuccess: false,
      kind: 'new_exercise',
      draft: {
        exercises: [{
          exerciseId: '', name: '푸쉬업',
          sets: [{ round: 1, reps: 100, weight: 0, weightUnit: 'kg' }],
        }],
      },
      suggestedMuscleGroupIds: ['mg-chest'],
      muscleGroups: [{ id: 'mg-chest', name: '가슴' }],
      originalName: '푸귀업',
      suggestedEquipment: '맨몸',
    });
    await useChatStore.getState().openForDate('2026-04-19');
    await useChatStore.getState().sendMessage('푸귀업 100개 0키로');
    const assistant = useChatStore.getState().messages.find((m) => m.role === 'assistant')!;
    expect(assistant.originalName).toBe('푸귀업');
    expect(assistant.suggestedEquipment).toBe('맨몸');
  });

  it('rejectNewExercise marks message discarded without server call', async () => {
    sendMock.mockResolvedValue({
      reply: '스쿼트 신규 추가할까요?',
      confidence: 'high',
      parseSuccess: false,
      kind: 'new_exercise',
      draft: {
        exercises: [{
          exerciseId: '', name: '스쿼트',
          sets: [{ round: 1, reps: 10, weight: 100, weightUnit: 'kg' }],
        }],
      },
      suggestedMuscleGroupIds: [],
      muscleGroups: [],
    });
    await useChatStore.getState().openForDate('2026-04-19');
    await useChatStore.getState().sendMessage('딱히 없는운동 50 5');
    const msg = useChatStore.getState().messages.find((m) => m.role === 'assistant')!;
    await useChatStore.getState().rejectNewExercise(msg.id);
    const updated = useChatStore.getState().messages.find((m) => m.id === msg.id)!;
    expect(updated.status).toBe('discarded');
    expect(approveNewExerciseMock).not.toHaveBeenCalled();
  });
});
