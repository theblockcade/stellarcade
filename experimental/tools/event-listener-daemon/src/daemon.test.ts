import { describe, it, expect, vi } from 'vitest';
import * as crypto from 'crypto';
import {
  computeSignature,
  buildSignedHeaders,
  createMemoryCursorStore,
  computeBackoffDelayMs,
  deliverWithRetry,
  pollOnce,
  dispatchEvent,
  createDaemon,
} from './daemon';
import type { ContractEvent, GetEventsFn, WebhookDeliveryResult } from '../types';

describe('HMAC signature generation', () => {
  it('generates the correct HMAC-SHA256 signature for a payload', () => {
    const payload = JSON.stringify({ id: 'evt-1' });
    const secret = 'top-secret';
    const signature = computeSignature(payload, secret);
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(signature).toBe(expected);
  });

  it('includes the signature in the dispatched headers', () => {
    const headers = buildSignedHeaders('{"a":1}', 'secret');
    expect(headers['x-webhook-signature']).toBe(computeSignature('{"a":1}', 'secret'));
    expect(headers['content-type']).toBe('application/json');
  });
});

describe('event polling loop', () => {
  const makeEvent = (id: string, ledger: number): ContractEvent => ({
    id,
    ledger,
    contractId: 'C123',
    topic: [],
    value: null,
  });

  it('processes mock events in ascending ledger order', async () => {
    const getEvents: GetEventsFn = async () => ({
      events: [makeEvent('c', 30), makeEvent('a', 10), makeEvent('b', 20)],
      latestLedger: 30,
    });

    const result = await pollOnce(getEvents, { rpcUrl: 'x', contractIds: ['C123'] }, 0);
    expect(result.events.map((e) => e.id)).toEqual(['a', 'b', 'c']);
    expect(result.nextLedger).toBe(31);
  });

  it('never regresses the cursor when no new events are found', async () => {
    const getEvents: GetEventsFn = async () => ({ events: [], latestLedger: 5 });
    const result = await pollOnce(getEvents, { rpcUrl: 'x', contractIds: ['C123'] }, 10);
    expect(result.nextLedger).toBe(10);
  });

  it('persists the cursor to the store after each daemon tick', async () => {
    const getEvents: GetEventsFn = async () => ({
      events: [makeEvent('a', 100)],
      latestLedger: 100,
    });
    const cursorStore = createMemoryCursorStore(0);
    const daemon = createDaemon(
      {
        rpcUrl: 'x',
        contractIds: ['C123'],
        webhookUrl: 'http://localhost/hook',
        secret: 's',
        pollIntervalMs: 1000,
      },
      {
        getEvents,
        deliverWebhook: async () => ({ ok: true, status: 200 }),
        cursorStore,
      }
    );

    await daemon.tick();
    expect(await cursorStore.load()).toBe(101);
  });
});

describe('webhook dispatch', () => {
  it('generates the correct HMAC signature for the dispatched event payload', async () => {
    const event: ContractEvent = { id: 'e1', ledger: 1, contractId: 'C', topic: [], value: 1 };
    let capturedHeaders: Record<string, string> = {};
    let capturedBody = '';

    await dispatchEvent(event, 'http://localhost/hook', 'my-secret', {
      deliverWebhook: async (_url, body, headers) => {
        capturedBody = body;
        capturedHeaders = headers;
        return { ok: true, status: 200 };
      },
    });

    expect(capturedHeaders['x-webhook-signature']).toBe(computeSignature(capturedBody, 'my-secret'));
  });
});

describe('retry queue backoff', () => {
  it('computes exponentially increasing delays, capped at the ceiling', () => {
    expect(computeBackoffDelayMs(0, 500, 30_000)).toBe(500);
    expect(computeBackoffDelayMs(1, 500, 30_000)).toBe(1000);
    expect(computeBackoffDelayMs(2, 500, 30_000)).toBe(2000);
    expect(computeBackoffDelayMs(10, 500, 30_000)).toBe(30_000);
  });

  it('retries after a 500 response and eventually succeeds', async () => {
    const sleep = vi.fn(async () => {});
    let attempts = 0;
    const deliver = vi.fn(async (): Promise<WebhookDeliveryResult> => {
      attempts += 1;
      if (attempts < 3) return { ok: false, status: 500 };
      return { ok: true, status: 200 };
    });

    const result = await deliverWithRetry(deliver, { maxRetries: 5, sleep });

    expect(result.ok).toBe(true);
    expect(deliver).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenNthCalledWith(1, computeBackoffDelayMs(0));
    expect(sleep).toHaveBeenNthCalledWith(2, computeBackoffDelayMs(1));
  });

  it('gives up after maxRetries and returns the last failure', async () => {
    const sleep = vi.fn(async () => {});
    const deliver = vi.fn(async (): Promise<WebhookDeliveryResult> => ({ ok: false, status: 500 }));

    const result = await deliverWithRetry(deliver, { maxRetries: 2, sleep });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(deliver).toHaveBeenCalledTimes(3); // initial + 2 retries
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});

describe('cursor persistence', () => {
  it('round-trips through the in-memory cursor store', async () => {
    const store = createMemoryCursorStore();
    expect(await store.load()).toBeNull();
    await store.save(42);
    expect(await store.load()).toBe(42);
  });
});
