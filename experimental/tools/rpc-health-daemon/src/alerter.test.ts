import { describe, it, expect, vi, beforeEach } from 'vitest';
import http from 'node:http';
import { Alerter, MetricsServer } from './alerter.js';

describe('Alerter', () => {
  let alerter: Alerter;

  beforeEach(() => {
    alerter = new Alerter();
  });

  it('should report healthy status in metrics', () => {
    alerter.updateMetrics({
      timestamp: new Date().toISOString(),
      healthy: true,
      ledgerSequence: 100,
      latencyMs: 50,
      latencySpike: false,
      stalled: false,
      error: null,
    });

    const metrics = alerter.getPrometheusMetrics();
    expect(metrics).toContain('soroban_rpc_health_status 1');
    expect(metrics).toContain('soroban_rpc_ledger_sequence 100');
    expect(metrics).toContain('soroban_rpc_latency_ms 50');
  });

  it('should report unhealthy status in metrics', () => {
    alerter.updateMetrics({
      timestamp: new Date().toISOString(),
      healthy: false,
      ledgerSequence: 100,
      latencyMs: 0,
      latencySpike: false,
      stalled: false,
      error: 'Connection refused',
    });

    const metrics = alerter.getPrometheusMetrics();
    expect(metrics).toContain('soroban_rpc_health_status 0');
  });

  it('should increment stalled counter when recordStall is called', () => {
    alerter.recordStall();
    alerter.recordStall();

    const metrics = alerter.getPrometheusMetrics();
    expect(metrics).toContain('soroban_rpc_stalled_total 2');
  });

  it('should trigger stalled ledger alert when ledger does not advance', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const firstSequence = 100;
    const now = Date.now();

    alerter.updateMetrics({
      timestamp: new Date(now).toISOString(),
      healthy: true,
      ledgerSequence: firstSequence,
      latencyMs: 50,
      latencySpike: false,
      stalled: false,
      error: null,
    });

    alerter.updateMetrics({
      timestamp: new Date(now).toISOString(),
      healthy: true,
      ledgerSequence: firstSequence,
      latencyMs: 50,
      latencySpike: false,
      stalled: true,
      error: null,
    });

    alerter.logAlerts({
      timestamp: new Date(now).toISOString(),
      healthy: true,
      ledgerSequence: firstSequence,
      latencyMs: 50,
      latencySpike: false,
      stalled: true,
      error: null,
    });

    alerter.recordStall();

    const metrics = alerter.getPrometheusMetrics();
    expect(metrics).toContain('soroban_rpc_stalled_total 1');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Ledger stalled'),
    );

    consoleSpy.mockRestore();
  });

  it('should record latency spikes', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    alerter.recordLatencySpike(1500);

    const metrics = alerter.getPrometheusMetrics();
    expect(metrics).toContain('soroban_rpc_latency_spike_total 1');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('1500ms'),
    );

    consoleSpy.mockRestore();
  });
});

describe('MetricsServer', () => {
  let alerter: Alerter;
  let server: MetricsServer;

  beforeEach(() => {
    alerter = new Alerter();
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
    }
  });

  it('should serve Prometheus metrics on /metrics', async () => {
    alerter.updateMetrics({
      timestamp: new Date().toISOString(),
      healthy: true,
      ledgerSequence: 200,
      latencyMs: 30,
      latencySpike: false,
      stalled: false,
      error: null,
    });

    server = new MetricsServer(alerter, 19876);
    server.start();

    await new Promise((resolve) => setTimeout(resolve, 200));

    const body = await httpGet('http://localhost:19876/metrics');
    expect(body).toContain('soroban_rpc_health_status 1');
    expect(body).toContain('soroban_rpc_ledger_sequence 200');
  });

  it('should serve health check on /health', async () => {
    server = new MetricsServer(alerter, 19877);
    server.start();

    await new Promise((resolve) => setTimeout(resolve, 200));

    const body = await httpGet('http://localhost:19877/health');
    const parsed = JSON.parse(body);
    expect(parsed.status).toBe('ok');
  });

  it('should return 404 for unknown paths', async () => {
    server = new MetricsServer(alerter, 19878);
    server.start();

    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      await httpGet('http://localhost:19878/unknown');
    } catch (e: unknown) {
      expect((e as { statusCode: number }).statusCode).toBe(404);
    }
  });
});

function httpGet(url: string): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          const err = new Error(`HTTP ${res.statusCode}`) as Error & { statusCode: number };
          err.statusCode = res.statusCode;
          reject(err);
        } else {
          resolve({ statusCode: res.statusCode ?? 0, body: data });
        }
      });
    }).on('error', reject);
  });
}
