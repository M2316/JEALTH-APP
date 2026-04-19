import { __resetMockDb } from 'expo-sqlite';
import {
  initChatDb,
  insertMessage,
  loadMessagesForDate,
  updateMessageStatus,
  getContextSinceLastApproved,
} from '../chat-db';

beforeEach(() => { __resetMockDb(); });

describe('chat-db', () => {
  it('inserts a user message and reads it back by date', async () => {
    await initChatDb();
    const id = await insertMessage({
      date: '2026-04-18', role: 'user', content: '벤치 4세트', status: 'saved', createdAt: 1,
    });
    expect(id).toBeGreaterThan(0);
    const msgs = await loadMessagesForDate('2026-04-18');
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toBe('벤치 4세트');
  });

  it('updates status from pending to saved', async () => {
    await initChatDb();
    const id = await insertMessage({
      date: '2026-04-18', role: 'assistant', content: 'ok', status: 'pending', createdAt: 1,
    });
    await updateMessageStatus(id, 'saved', 'r-uuid');
    const msgs = await loadMessagesForDate('2026-04-18');
    expect(msgs[0].status).toBe('saved');
    expect(msgs[0].routineId).toBe('r-uuid');
  });

  it('getContextSinceLastApproved returns all msgs when no approved exists', async () => {
    await initChatDb();
    await insertMessage({ date: '2026-04-18', role: 'user', content: 'a', status: 'saved', createdAt: 1 });
    await insertMessage({ date: '2026-04-18', role: 'assistant', content: 'b', status: 'pending', createdAt: 2 });
    const ctx = await getContextSinceLastApproved('2026-04-18');
    expect(ctx).toHaveLength(2);
  });

  it('getContextSinceLastApproved excludes msgs at or before last saved assistant', async () => {
    await initChatDb();
    await insertMessage({ date: '2026-04-18', role: 'user', content: 'a', status: 'saved', createdAt: 1 });
    await insertMessage({ date: '2026-04-18', role: 'assistant', content: 'b', status: 'saved', createdAt: 2 });
    await insertMessage({ date: '2026-04-18', role: 'user', content: 'c', status: 'saved', createdAt: 3 });
    const ctx = await getContextSinceLastApproved('2026-04-18');
    expect(ctx.map((m) => m.content)).toEqual(['c']);
  });
});

describe('chat-db v2 migration', () => {
  it('stores and reads back kind, suggestedMuscleGroupIds, muscleGroups', async () => {
    await initChatDb();
    const id = await insertMessage({
      date: '2026-04-19',
      role: 'assistant',
      content: '스쿼트 신규 추가할까요?',
      draft: {
        exercises: [
          {
            exerciseId: '',
            name: '스쿼트',
            sets: [{ round: 1, reps: 10, weight: 100, weightUnit: 'kg' }],
          },
        ],
      },
      status: 'pending',
      createdAt: 1,
      kind: 'new_exercise',
      suggestedMuscleGroupIds: ['mg-leg', 'mg-quad'],
      muscleGroups: [
        { id: 'mg-leg', name: '하체' },
        { id: 'mg-quad', name: '대퇴사두' },
      ],
    });
    expect(id).toBeGreaterThan(0);
    const msgs = await loadMessagesForDate('2026-04-19');
    expect(msgs[0].kind).toBe('new_exercise');
    expect(msgs[0].suggestedMuscleGroupIds).toEqual(['mg-leg', 'mg-quad']);
    expect(msgs[0].muscleGroups).toEqual([
      { id: 'mg-leg', name: '하체' },
      { id: 'mg-quad', name: '대퇴사두' },
    ]);
  });

  it('loads legacy rows with null kind as undefined (not "existing")', async () => {
    await initChatDb();
    await insertMessage({
      date: '2026-04-19', role: 'assistant', content: 'x',
      status: 'saved', createdAt: 1,
    });
    const [msg] = await loadMessagesForDate('2026-04-19');
    expect(msg.kind).toBeUndefined();
  });
});
