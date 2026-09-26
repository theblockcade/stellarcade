export interface DaemonConfig {
  rpcUrl: string;
  contractIds: string[];
  webhookUrl: string;
  secret: string;
  pollIntervalMs: number;
  cursorFile?: string;
  maxRetries?: number;
}

export interface ContractEvent {
  id: string;
  ledger: number;
  contractId: string;
  topic: unknown[];
  value: unknown;
}

export interface GetEventsResult {
  events: ContractEvent[];
  latestLedger: number;
}

/** Fetches events starting at (and including) startLedger, for the given contracts. */
export type GetEventsFn = (
  rpcUrl: string,
  contractIds: string[],
  startLedger: number
) => Promise<GetEventsResult>;

export interface WebhookDeliveryResult {
  ok: boolean;
  status: number;
}

/** Delivers a signed webhook payload; returns the response status. */
export type DeliverWebhookFn = (
  url: string,
  body: string,
  headers: Record<string, string>
) => Promise<WebhookDeliveryResult>;

export interface CursorStore {
  load(): Promise<number | null>;
  save(ledger: number): Promise<void>;
}
