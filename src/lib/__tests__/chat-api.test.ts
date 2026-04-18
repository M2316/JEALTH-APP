import { sendChatWorkout } from '../chat-api';

jest.mock('../api', () => ({ api: jest.fn() }));

const apiMock = require('../api').api as jest.MockedFunction<
  (path: string, options?: RequestInit) => Promise<unknown>
>;

describe('chat-api', () => {
  beforeEach(() => apiMock.mockReset());

  it('POSTs to /chat/workout with date and messages', async () => {
    apiMock.mockResolvedValue({
      reply: 'ok',
      confidence: 'high',
      draft: { exercises: [] },
    });

    const payload = {
      date: '2026-04-18',
      messages: [{ role: 'user' as const, content: '안녕' }],
    };

    const res = await sendChatWorkout(payload);

    expect(apiMock).toHaveBeenCalledTimes(1);
    const args = apiMock.mock.calls[0];
    expect(args[0]).toBe('/chat/workout');
    expect(args[1]?.method).toBe('POST');
    expect(args[1]?.body).toBe(JSON.stringify(payload));
    expect(res).toEqual({
      reply: 'ok',
      confidence: 'high',
      draft: { exercises: [] },
    });
  });
});
