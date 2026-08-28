import http from 'node:http';
import type { HealthReport } from './health-checker.js';

export class Alerter {
  private healthStatus: number = 1;
  private ledgerSequence: number = 0;
  private latencyMs: number = 0;
  private stalledTotal: number = 0;
  private latencySpikeTotal: number = 0;

  updateMetrics(report: HealthReport): void {
    this.healthStatus = report.healthy ? 1 : 0;
    if (report.ledgerSequence !== null) {
      this.ledgerSequence = report.ledgerSequence;
    }
    this.latencyMs = report.latencyMs;
  }

  logAlerts(report: HealthReport): void {
    if (!report.healthy) {
      console.error(`[ALERT] [${report.timestamp}] RPC node unhealthy: ${report.error}`);
    }
    if (report.stalled) {
      console.error(
        `[ALERT] [${report.timestamp}] Ledger stalled at sequence ${report.ledgerSequence} for >30s`,
      );
    }
    if (report.latencySpike) {
      console.warn(
        `[WARN]  [${report.timestamp}] Latency spike: ${report.latencyMs}ms (threshold: 1000ms)`,
      );
    }
  }

  recordStall(): void {
    this.stalledTotal++;
  }

  recordLatencySpike(ms: number): void {
    this.latencySpikeTotal++;
    console.warn(`[WARN]  Latency spike recorded: ${ms}ms`);
  }

  getPrometheusMetrics(): string {
    const lines = [
      `# HELP soroban_rpc_health_status Whether the RPC node is healthy (1) or unhealthy (0)`,
      `# TYPE soroban_rpc_health_status gauge`,
      `soroban_rpc_health_status ${this.healthStatus}`,
      '',
      `# HELP soroban_rpc_ledger_sequence Current ledger sequence number`,
      `# TYPE soroban_rpc_ledger_sequence gauge`,
      `soroban_rpc_ledger_sequence ${this.ledgerSequence}`,
      '',
      `# HELP soroban_rpc_latency_ms Response latency in milliseconds`,
      `# TYPE soroban_rpc_latency_ms gauge`,
      `soroban_rpc_latency_ms ${this.latencyMs}`,
      '',
      `# HELP soroban_rpc_stalled_total Total number of stalled ledger alerts`,
      `# TYPE soroban_rpc_stalled_total counter`,
      `soroban_rpc_stalled_total ${this.stalledTotal}`,
      '',
      `# HELP soroban_rpc_latency_spike_total Total number of latency spike alerts`,
      `# TYPE soroban_rpc_latency_spike_total counter`,
      `soroban_rpc_latency_spike_total ${this.latencySpikeTotal}`,
      '',
    ];
    return lines.join('\n');
  }
}

export class MetricsServer {
  private alerter: Alerter;
  private port: number;
  private server: http.Server | null = null;

  constructor(alerter: Alerter, port: number) {
    this.alerter = alerter;
    this.port = port;
  }

  start(): void {
    this.server = http.createServer((req, res) => {
      if (req.url === '/metrics' && req.method === 'GET') {
        const metrics = this.alerter.getPrometheusMetrics();
        res.writeHead(200, {
          'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        });
        res.end(metrics);
      } else if (req.url === '/health' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found\n');
      }
    });

    this.server.listen(this.port, () => {
      console.log(`[metrics-server] Prometheus metrics available at http://localhost:${this.port}/metrics`);
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
