import { __resetMockDb } from 'expo-sqlite';
import { useChatStore } from '../chat-store';
import * as chatApi from '@/lib/chat-api';
import * as workoutApi from '@/lib/workout-api';

jest.mock('@/lib/chat-api');
jest.mock('@/lib/workout-api');

const sendMock = chatApi.sendChatWorkout as jest.MockedFunction<typeof chatApi.sendChatWorkout>;
const createRoutineMock = workoutApi.createRoutine as jest.MockedFunction<typeof workoutApi.createRoutine>;

beforeEach(() => {
  __resetMockDb();
  sendMock.mockReset();
  createRoutineMock.mockReset();
  useChatStore.setState({ messages: [], isSending: false, currentDate: null, confidenceByMsgId: {} });
});

describe('chat-store', () => {
  it('sendMessage inserts user message, calls API, inserts assistant draft', async () => {
    sendMock.mockResolvedValue({
      reply: '맞나요?',
      confidence: 'high',
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
});
