import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import type {
  ContractEvent,
  CursorStore,
  DaemonConfig,
  DeliverWebhookFn,
  GetEventsFn,
  WebhookDeliveryResult,
} from '../types';

/** HMAC-SHA256 signature of a webhook payload, used as the X-Webhook-Signature header. */
export function computeSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

export function buildSignedHeaders(payload: string, secret: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    'x-webhook-signature': computeSignature(payload, secret),
  };
}

/** File-backed cursor store tracking the last processed ledger across restarts. */
export function createFileCursorStore(path: string): CursorStore {
  return {
    async load() {
      try {
        const raw = await fs.readFile(path, 'utf8');
        const parsed = JSON.parse(raw);
        return typeof parsed.lastLedger === 'number' ? parsed.lastLedger : null;
      } catch {
        return null;
      }
    },
    async save(ledger: number) {
      await fs.writeFile(path, JSON.stringify({ lastLedger: ledger }), 'utf8');
    },
  };
}

/** In-memory cursor store, primarily for tests and dry runs. */
export function createMemoryCursorStore(initial: number | null = null): CursorStore {
  let cursor = initial;
  return {
    async load() {
      return cursor;
    },
    async save(ledger: number) {
      cursor = ledger;
    },
  };
}

/** Exponential backoff delay (ms) for a given retry attempt, capped at 30s. */
export function computeBackoffDelayMs(attempt: number, baseMs = 500, capMs = 30_000): number {
  return Math.min(baseMs * 2 ** attempt, capMs);
}

export interface RetryQueueOptions {
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Retries a webhook delivery with exponential backoff whenever the delivery
 * function reports a non-2xx (e.g. 500) response, up to maxRetries attempts.
 */
export async function deliverWithRetry(
  deliver: () => Promise<WebhookDeliveryResult>,
  options: RetryQueueOptions = {}
): Promise<WebhookDeliveryResult> {
  const maxRetries = options.maxRetries ?? 5;
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  let lastResult: WebhookDeliveryResult = { ok: false, status: 0 };
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await deliver();
    if (lastResult.ok) return lastResult;
    if (attempt < maxRetries) {
      await sleep(computeBackoffDelayMs(attempt));
    }
  }
  return lastResult;
}

export interface PollResult {
  events: ContractEvent[];
  nextLedger: number;
}

/** Fetches and returns events in ledger order for a single poll cycle. */
export async function pollOnce(
  getEvents: GetEventsFn,
  config: Pick<DaemonConfig, 'rpcUrl' | 'contractIds'>,
  fromLedger: number
): Promise<PollResult> {
  const result = await getEvents(config.rpcUrl, config.contractIds, fromLedger);
  const events = [...result.events].sort((a, b) => a.ledger - b.ledger);
  const nextLedger = Math.max(result.latestLedger + 1, fromLedger);
  return { events, nextLedger };
}

export interface DispatchDeps {
  deliverWebhook: DeliverWebhookFn;
  maxRetries?: number;
  sleep?: (ms: number) => Promise<void>;
}

/** Signs and dispatches a single contract event to the configured webhook, with retries. */
export async function dispatchEvent(
  event: ContractEvent,
  webhookUrl: string,
  secret: string,
  deps: DispatchDeps
): Promise<WebhookDeliveryResult> {
  const body = JSON.stringify(event);
  const headers = buildSignedHeaders(body, secret);

  return deliverWithRetry(() => deps.deliverWebhook(webhookUrl, body, headers), {
    maxRetries: deps.maxRetries,
    sleep: deps.sleep,
  });
}

export interface DaemonDeps {
  getEvents: GetEventsFn;
  deliverWebhook: DeliverWebhookFn;
  cursorStore: CursorStore;
  sleep?: (ms: number) => Promise<void>;
  onEventDelivered?: (event: ContractEvent, result: WebhookDeliveryResult) => void;
}

export interface Daemon {
  /** Runs a single poll + dispatch cycle and advances the persisted cursor. */
  tick(): Promise<PollResult>;
  /** Starts the polling loop; resolves once stop() has been called. */
  start(): Promise<void>;
  /** Requests a graceful stop; the loop finishes its current tick first. */
  stop(): void;
}

/** Builds a daemon instance from config + injected dependencies (RPC client, webhook transport, cursor store). */
export function createDaemon(config: DaemonConfig, deps: DaemonDeps): Daemon {
  let stopped = false;

  async function tick(): Promise<PollResult> {
    const cursor = (await deps.cursorStore.load()) ?? 0;
    const { events, nextLedger } = await pollOnce(deps.getEvents, config, cursor);

    for (const event of events) {
      const result = await dispatchEvent(event, config.webhookUrl, config.secret, {
        deliverWebhook: deps.deliverWebhook,
        maxRetries: config.maxRetries,
        sleep: deps.sleep,
      });
      deps.onEventDelivered?.(event, result);
    }

    await deps.cursorStore.save(nextLedger);
    return { events, nextLedger };
  }

  async function start(): Promise<void> {
    stopped = false;
    const sleep = deps.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
    while (!stopped) {
      await tick();
      if (stopped) break;
      await sleep(config.pollIntervalMs);
    }
  }

  function stop(): void {
    stopped = true;
  }

  return { tick, start, stop };
}
