import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import http from 'node:http';
import { HealthChecker } from './health-checker.js';
import { Alerter } from './alerter.js';

let mockServer: http.Server;
let mockHealthStatus: Record<string, unknown> = { status: 'OK' };
let mockLedgerData: Record<string, unknown> = { sequence: 1000 };
let requestCount = 0;

function startMockServer(port: number): Promise<void> {
  return new Promise((resolve) => {
    mockServer = http.createServer((req, res) => {
      let body = '';
      req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      req.on('end', () => {
        requestCount++;
        const parsed = JSON.parse(body);
        let responseData: Record<string, unknown>;

        if (parsed.method === 'getHealth') {
          responseData = mockHealthStatus;
        } else if (parsed.method === 'getLatestLedger') {
          responseData = mockLedgerData;
        } else {
          responseData = { error: 'Unknown method' };
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responseData));
      });
    });

    mockServer.listen(port, resolve);
  });
}

function stopMockServer(): Promise<void> {
  return new Promise((resolve) => {
    if (mockServer) {
      mockServer.close(() => resolve());
    } else {
      resolve();
    }
  });
}

describe('HealthChecker', () => {
  let alerter: Alerter;
  const TEST_PORT = 19901;

  beforeEach(async () => {
    alerter = new Alerter();
    requestCount = 0;
    mockHealthStatus = { status: 'OK' };
    mockLedgerData = { sequence: 1000 };
    await startMockServer(TEST_PORT);
  });

  afterEach(async () => {
    await stopMockServer();
  });

  it('should report healthy when RPC responds normally', async () => {
    const checker = new HealthChecker(`http://localhost:${TEST_PORT}`, 60, alerter);

    const report = await checker.runCheck();

    expect(report.healthy).toBe(true);
    expect(report.ledgerSequence).toBe(1000);
    expect(report.error).toBeNull();
    expect(report.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('should report unhealthy when RPC health endpoint fails', async () => {
    mockHealthStatus = { status: 'NOT_OK' };

    const checker = new HealthChecker(`http://localhost:${TEST_PORT}`, 60, alerter);

    const report = await checker.runCheck();

    expect(report.healthy).toBe(false);
    expect(report.error).toContain('NOT_OK');
  });

  it('should report unhealthy when server is unresponsive', async () => {
    await stopMockServer();

    const checker = new HealthChecker(`http://localhost:${TEST_PORT}`, 60, alerter);

    const report = await checker.runCheck();

    expect(report.healthy).toBe(false);
    expect(report.error).toBeTruthy();
  });

  it('should track health history', async () => {
    const checker = new HealthChecker(`http://localhost:${TEST_PORT}`, 60, alerter);

    await checker.runCheck();
    await checker.runCheck();
    await checker.runCheck();

    const history = checker.getHistory();
    expect(history).toHaveLength(3);
    expect(history[0].ledgerSequence).toBe(1000);
  });

  it('should detect latency spikes above 1000ms', async () => {
    const originalFn = (checker as unknown as { rpcPost: (body: object) => Promise<Record<string, unknown>> }).rpcPost;

    const slowPost = async (body: object): Promise<Record<string, unknown>> => {
      const record = body as { method: string };
      if (record.method === 'getHealth') {
        return { status: 'OK' };
      }
      await new Promise((resolve) => setTimeout(resolve, 1100));
      return { sequence: 1001 };
    };

    const checker = new HealthChecker(`http://localhost:${TEST_PORT}`, 60, alerter);
    (checker as unknown as { rpcPost: (body: object) => Promise<Record<string, unknown>> }).rpcPost = slowPost;

    const report = await checker.runCheck();

    expect(report.latencySpike).toBe(true);
    expect(report.latencyMs).toBeGreaterThan(1000);
  });

  it('should start and stop the check loop', async () => {
    const checker = new HealthChecker(`http://localhost:${TEST_PORT}`, 1, alerter);

    checker.start();

    await new Promise((resolve) => setTimeout(resolve, 2500));

    checker.stop();

    const historyAfterStop = checker.getHistory().length;

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const historyStillSame = checker.getHistory().length;

    expect(historyAfterStop).toBeGreaterThan(0);
    expect(historyStillSame).toBe(historyAfterStop);
  });
});
