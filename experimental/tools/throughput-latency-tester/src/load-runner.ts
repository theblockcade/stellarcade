import type { ThroughputConfig, TransactionResult, MetricsSummary } from './types';
import type { MetricsCollector } from './metrics-collector';

class Semaphore {
  private waiters: (() => void)[] = [];
  private current = 0;

  constructor(private readonly max: number) {}

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  release(): void {
    if (this.waiters.length > 0) {
      const next = this.waiters.shift()!;
      next();
    } else {
      this.current--;
    }
  }
}

export class LoadRunner {
  private config: ThroughputConfig;
  private collector: MetricsCollector;

  constructor(config: ThroughputConfig, collector: MetricsCollector) {
    this.config = config;
    this.collector = collector;
  }

  async run(): Promise<MetricsSummary> {
    this.collector.markRunStart();

    const { totalRequests, concurrency, rampUpMs } = this.config;
    let currentConcurrency = 1;

    const rampUpInterval = rampUpMs > 0 && concurrency > 1
      ? rampUpMs / (concurrency - 1)
      : 0;

    if (rampUpMs > 0 && concurrency > 1) {
      const rampTimer = setInterval(() => {
        if (currentConcurrency < concurrency) {
          currentConcurrency++;
        }
        if (currentConcurrency >= concurrency) {
          clearInterval(rampTimer);
        }
      }, rampUpInterval);
    } else {
      currentConcurrency = concurrency;
    }

    const semaphore = new Semaphore(concurrency);
    const inFlight: Promise<void>[] = [];
    let nextId = 0;

    const fireTransaction = async (id: number): Promise<void> => {
      await semaphore.acquire();
      try {
        const result = await this.simulateTransaction(id);
        this.collector.recordTransaction(result);
      } finally {
        semaphore.release();
      }
    };

    for (let i = 0; i < totalRequests; i++) {
      const id = nextId++;
      const transactionDelay = rampUpMs > 0
        ? (i / totalRequests) * rampUpMs * 0.5
        : 0;

      if (transactionDelay > 0) {
        const p = new Promise<void>((resolve) => {
          setTimeout(() => {
            fireTransaction(id).then(resolve);
          }, transactionDelay);
        });
        inFlight.push(p);
      } else {
        inFlight.push(fireTransaction(id));
      }
    }

    await Promise.all(inFlight);

    this.collector.markRunEnd();

    return this.collector.getSummary();
  }

  async simulateTransaction(id: number): Promise<TransactionResult> {
    const submissionMs = randomDelay(5, 50);
    const inclusionMs = randomDelay(10, 100);
    const simulationMs = randomDelay(5, 80);
    const totalMs = submissionMs + inclusionMs + simulationMs;

    await delay(totalMs);

    const success = Math.random() > 0.05;

    return {
      id: `tx_${id}`,
      success,
      submissionMs,
      inclusionMs,
      simulationMs,
      totalMs,
      error: success ? undefined : 'Simulated transaction failure',
    };
  }
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
