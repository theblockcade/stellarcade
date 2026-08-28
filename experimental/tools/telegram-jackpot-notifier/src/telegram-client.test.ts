import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatJackpotMessage,
  truncateAddress,
  escapeHtml,
  RateLimiter,
  withRetry,
} from './telegram-client.js';

describe('formatJackpotMessage', () => {
  const baseEvent = {
    winnerAddress: 'GBZC6B3MASKLCZKFZ3FTZ5JHX7MXXXVX5S5YXXXXXXYY',
    prizeAmount: 1250.5,
    gameTitle: 'Coin Flip Ultra',
    txHash: 'abc123def456789',
  };

  it('includes trophy emoji and title', () => {
    const msg = formatJackpotMessage(baseEvent);
    expect(msg).toContain('🏆');
    expect(msg).toContain('<b>Coin Flip Ultra</b>');
  });

  it('includes prize amount in XLM', () => {
    const msg = formatJackpotMessage(baseEvent);
    expect(msg).toContain('1250.50 XLM');
  });

  it('includes truncated winner address', () => {
    const msg = formatJackpotMessage(baseEvent);
    expect(msg).toContain('GBZC6B3M...XXYY');
  });

  it('includes handle when provided', () => {
    const msg = formatJackpotMessage({ ...baseEvent, winnerHandle: 'arcade_champ' });
    expect(msg).toContain('@arcade_champ');
  });

  it('excludes handle when not provided', () => {
    const msg = formatJackpotMessage(baseEvent);
    expect(msg).not.toContain('@');
  });

  it('includes Stellar Expert link', () => {
    const msg = formatJackpotMessage(baseEvent);
    expect(msg).toContain('stellar.expert/explorer/public/tx/abc123def456789');
  });

  it('escapes HTML in game title', () => {
    const msg = formatJackpotMessage({ ...baseEvent, gameTitle: 'X < Y & Z' });
    expect(msg).toContain('X &lt; Y &amp; Z');
  });
});

describe('truncateAddress', () => {
  it('truncates long addresses', () => {
    expect(truncateAddress('GBZC6B3MASKLCZKFZ3FTZ5JHX7MXXXVX5S5YXXXXXXYY')).toBe('GBZC6B3M...XXYY');
  });

  it('returns short addresses unchanged', () => {
    expect(truncateAddress('short')).toBe('short');
  });
});

describe('escapeHtml', () => {
  it('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<tag>')).toBe('&lt;tag&gt;');
  });

  it('leaves normal text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows acquisition when tokens available', () => {
    const limiter = new RateLimiter(10);
    expect(limiter.tryAcquire()).toBe(true);
  });

  it('rate limits when tokens exhausted', () => {
    const limiter = new RateLimiter(2); // 2 per sec
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(true);
    expect(limiter.tryAcquire()).toBe(false);
  });

  it('refills tokens over time', () => {
    const limiter = new RateLimiter(2);
    limiter.tryAcquire();
    limiter.tryAcquire();
    expect(limiter.tryAcquire()).toBe(false);

    vi.advanceTimersByTime(600); // should refill ~1.2 tokens
    expect(limiter.tryAcquire()).toBe(true);
  });

  it('returns time until next token', () => {
    const limiter = new RateLimiter(10);
    limiter.tryAcquire(); // exhaust
    for (let i = 0; i < 10; i++) limiter.tryAcquire();
    const wait = limiter.timeUntilNextToken();
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(200);
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, { attempt: 0, maxAttempts: 3, baseDelayMs: 100 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and eventually succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValue('ok');

    const resultPromise = withRetry(fn, { attempt: 0, maxAttempts: 3, baseDelayMs: 100 });

    // Advance past retry delays
    await vi.advanceTimersByTimeAsync(500);
    const result = await resultPromise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws after max attempts exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('permanent fail'));

    const resultPromise = withRetry(fn, { attempt: 0, maxAttempts: 2, baseDelayMs: 100 })
      .catch((err) => err); // prevent unhandled rejection

    await vi.advanceTimersByTimeAsync(1000);

    const err = await resultPromise;
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toBe('permanent fail');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});
