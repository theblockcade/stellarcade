import type { JackpotWinEvent, NotifierConfig } from './types.js';

/** Fetch recent contract events from Soroban RPC (simplified mock). */
export async function fetchRecentEvents(
  rpcUrl: string,
  contractId?: string,
): Promise<JackpotWinEvent[]> {
  // In production this would query Soroban RPC getEvents endpoint.
  // For now, this is a stub that returns an empty array — the actual
  // event source would be wired up via the Soroban SDK getEvents call.
  //
  // Example Soroban RPC call:
  //   POST {rpcUrl}/events
  //   body: { start_ledger, filters: [{ type: "contract", contract_ids: [...] }] }
  //
  // For testing, this returns [] and the poller loop simply finds nothing.
  void rpcUrl;
  void contractId;
  return [];
}

/** Poll for new events at a fixed interval. Calls onEvent for each new jackpot win. */
export function startPolling(
  config: NotifierConfig,
  onEvent: (event: JackpotWinEvent) => Promise<void>,
): { stop: () => void } {
  const intervalMs = config.pollIntervalMs ?? 15000;
  let running = true;
  let lastPoll = Date.now();

  const poll = async () => {
    if (!running) return;

    try {
      const events = await fetchRecentEvents(config.rpcUrl);

      for (const event of events) {
        if (event.prizeAmount >= config.minNotifyAmount) {
          await onEvent(event);
        }
      }
    } catch (err: any) {
      console.error(`[poller] Error fetching events: ${err.message}`);
    }

    lastPoll = Date.now();
  };

  const timer = setInterval(poll, intervalMs);

  // Run first poll immediately
  poll();

  return {
    stop: () => {
      running = false;
      clearInterval(timer);
    },
  };
}
