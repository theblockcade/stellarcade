import https from 'node:https';
import http from 'node:http';
import { Alerter } from './alerter.js';

export interface HealthReport {
  timestamp: string;
  healthy: boolean;
  ledgerSequence: number | null;
  latencyMs: number;
  latencySpike: boolean;
  stalled: boolean;
  error: string | null;
}

const STALL_THRESHOLD_MS = 30_000;
const LATENCY_SPIKE_MS = 1_000;
const MAX_HISTORY = 100;

export class HealthChecker {
  private rpcUrl: string;
  private intervalSec: number;
  private alerter: Alerter;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private lastLedgerSequence: number | null = null;
  private lastLedgerTimestamp: number | null = null;
  private history: HealthReport[] = [];

  constructor(rpcUrl: string, intervalSec: number, alerter: Alerter) {
    this.rpcUrl = rpcUrl;
    this.intervalSec = intervalSec;
    this.alerter = alerter;
  }

  start(): void {
    this.runCheck();
    this.intervalHandle = setInterval(() => this.runCheck(), this.intervalSec * 1000);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  getHistory(): HealthReport[] {
    return [...this.history];
  }

  async runCheck(): Promise<HealthReport> {
    const report = await this.performCheck();
    this.history.push(report);
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY);
    }
    this.alerter.updateMetrics(report);
    this.alerter.logAlerts(report);
    return report;
  }

  private async performCheck(): Promise<HealthReport> {
    const timestamp = new Date().toISOString();
    let healthy = true;
    let ledgerSequence: number | null = null;
    let latencyMs = 0;
    let latencySpike = false;
    let stalled = false;
    let error: string | null = null;

    try {
      const healthResult = await this.rpcPost({ method: 'getHealth' });
      if (healthResult.status !== 'OK') {
        healthy = false;
        error = `RPC returned status: ${healthResult.status}`;
      }
    } catch (e) {
      healthy = false;
      error = `Health check failed: ${e instanceof Error ? e.message : String(e)}`;
    }

    try {
      const start = Date.now();
      const ledgerResult = await this.rpcPost({ method: 'getLatestLedger' });
      latencyMs = Date.now() - start;

      if (latencyMs > LATENCY_SPIKE_MS) {
        latencySpike = true;
        this.alerter.recordLatencySpike(latencyMs);
      }

      ledgerSequence = ledgerResult.sequence ?? null;

      if (ledgerSequence !== null) {
        const now = Date.now();
        if (this.lastLedgerSequence !== null && this.lastLedgerTimestamp !== null) {
          if (ledgerSequence === this.lastLedgerSequence) {
            if (now - this.lastLedgerTimestamp > STALL_THRESHOLD_MS) {
              stalled = true;
              this.alerter.recordStall();
            }
          } else {
            this.lastLedgerTimestamp = now;
          }
        } else {
          this.lastLedgerTimestamp = now;
        }
        this.lastLedgerSequence = ledgerSequence;
      }
    } catch (e) {
      healthy = false;
      latencyMs = 0;
      if (!error) {
        error = `Ledger check failed: ${e instanceof Error ? e.message : String(e)}`;
      }
    }

    return {
      timestamp,
      healthy,
      ledgerSequence,
      latencyMs,
      latencySpike,
      stalled,
      error,
    };
  }

  private rpcPost(body: object): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.rpcUrl);
      const transport = url.protocol === 'https:' ? https : http;
      const payload = JSON.stringify(body);

      const req = transport.request(
        {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
          timeout: 10_000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk: Buffer) => {
            data += chunk.toString();
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error('Invalid JSON response'));
            }
          });
        },
      );

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });
      req.write(payload);
      req.end();
    });
  }
}
