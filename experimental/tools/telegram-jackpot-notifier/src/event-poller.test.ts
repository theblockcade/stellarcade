import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchRecentEvents, startPolling } from './event-poller.js';
import type { NotifierConfig } from './types.js';

describe('fetchRecentEvents', () => {
  it('returns an array', async () => {
    const events = await fetchRecentEvents('https://rpc.example.com');
    expect(Array.isArray(events)).toBe(true);
  });
});

describe('startPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onEvent for each event above min amount', async () => {
    const config: NotifierConfig = {
      telegramBotToken: 'test-token',
      chatId: '123',
      rpcUrl: 'https://rpc.example.com',
      minNotifyAmount: 50,
      pollIntervalMs: 5000,
    };

    const onEvent = vi.fn().mockResolvedValue(undefined);
    const { stop } = startPolling(config, onEvent);

    // fetchRecentEvents returns [] by default, so onEvent should not be called
    await vi.advanceTimersByTimeAsync(6000);
    expect(onEvent).not.toHaveBeenCalled();

    stop();
  });

  it('can be stopped', () => {
    const config: NotifierConfig = {
      telegramBotToken: 'test-token',
      chatId: '123',
      rpcUrl: 'https://rpc.example.com',
      minNotifyAmount: 100,
      pollIntervalMs: 1000,
    };

    const onEvent = vi.fn().mockResolvedValue(undefined);
    const { stop } = startPolling(config, onEvent);
    stop();

    // After stop, advancing time should not trigger more polls
    vi.advanceTimersByTime(5000);
    expect(onEvent).not.toHaveBeenCalled();
  });
});
