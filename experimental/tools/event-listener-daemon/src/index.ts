#!/usr/bin/env node

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { createDaemon, createFileCursorStore, computeBackoffDelayMs } from './daemon';
import type { DaemonConfig, DeliverWebhookFn, GetEventsFn, GetEventsResult } from '../types';

function readConfig(): DaemonConfig {
  const rpcUrl = process.env.RPC_URL;
  const contractIds = (process.env.CONTRACT_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const webhookUrl = process.env.WEBHOOK_URL;
  const secret = process.env.WEBHOOK_SECRET;
  const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS ?? '5000');

  if (!rpcUrl || contractIds.length === 0 || !webhookUrl || !secret) {
    console.error(
      'Missing required env vars: RPC_URL, CONTRACT_IDS (comma-separated), WEBHOOK_URL, WEBHOOK_SECRET'
    );
    process.exit(2);
  }

  return {
    rpcUrl: rpcUrl!,
    contractIds,
    webhookUrl: webhookUrl!,
    secret: secret!,
    pollIntervalMs: Number.isNaN(pollIntervalMs) ? 5000 : pollIntervalMs,
    cursorFile: process.env.CURSOR_FILE ?? './cursor.json',
    maxRetries: Number(process.env.MAX_RETRIES ?? '5'),
  };
}

/** Calls Soroban's getEvents JSON-RPC method for the given contracts, starting at startLedger. */
const rpcGetEvents: GetEventsFn = async (rpcUrl, contractIds, startLedger) => {
  const body = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'getEvents',
    params: {
      startLedger,
      filters: [{ contractIds, type: 'contract' }],
    },
  });

  const response = await httpPost(rpcUrl, body, { 'content-type': 'application/json' });
  const parsed = JSON.parse(response.body);

  if (parsed.error) {
    throw new Error(`RPC error: ${parsed.error.message ?? JSON.stringify(parsed.error)}`);
  }

  const result: GetEventsResult = {
    events: (parsed.result?.events ?? []).map((e: Record<string, unknown>) => ({
      id: e.id,
      ledger: e.ledger,
      contractId: e.contractId,
      topic: e.topic ?? [],
      value: e.value,
    })),
    latestLedger: parsed.result?.latestLedger ?? startLedger,
  };

  return result;
};

const deliverWebhook: DeliverWebhookFn = async (url, body, headers) => {
  const response = await httpPost(url, body, headers);
  return { ok: response.status >= 200 && response.status < 300, status: response.status };
};

function httpPost(
  urlStr: string,
  body: string,
  headers: Record<string, string>
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(
      url,
      {
        method: 'POST',
        headers: { ...headers, 'content-length': Buffer.byteLength(body) },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function main(): void {
  const config = readConfig();
  const cursorStore = createFileCursorStore(config.cursorFile!);

  const daemon = createDaemon(config, {
    getEvents: rpcGetEvents,
    deliverWebhook,
    cursorStore,
    onEventDelivered: (event, result) => {
      const status = result.ok ? 'delivered' : `failed (status ${result.status})`;
      console.log(`[event ${event.id} @ ledger ${event.ledger}] ${status}`);
    },
  });

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    daemon.stop();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  console.log(`event-listener-daemon starting: contracts=${config.contractIds.join(',')} rpc=${config.rpcUrl}`);
  daemon.start().then(() => console.log('event-listener-daemon stopped'));
}

if (require.main === module) {
  main();
}

export { createDaemon, createFileCursorStore, computeBackoffDelayMs } from './daemon';
export * from '../types';
