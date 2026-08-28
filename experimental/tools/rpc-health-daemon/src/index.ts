#!/usr/bin/env node

import { Command } from 'commander';
import { HealthChecker } from './health-checker.js';
import { Alerter, MetricsServer } from './alerter.js';

const program = new Command();

program
  .name('rpc-health-daemon')
  .description('Soroban RPC node health monitoring daemon with Prometheus metrics')
  .version('0.0.1')
  .option('--rpc-url <url>', 'Soroban RPC URL to monitor', 'https://soroban-testnet.stellar.org')
  .option('--interval-sec <n>', 'Health check interval in seconds', '5')
  .option('--port <metrics-port>', 'Prometheus metrics HTTP server port', '9090')
  .action(async (opts) => {
    const rpcUrl: string = opts.rpcUrl;
    const intervalSec: number = parseInt(opts.intervalSec, 10);
    const port: number = parseInt(opts.port, 10);

    if (isNaN(intervalSec) || intervalSec <= 0) {
      console.error('Error: --interval-sec must be a positive integer');
      process.exit(1);
    }
    if (isNaN(port) || port <= 0 || port > 65535) {
      console.error('Error: --port must be an integer between 1 and 65535');
      process.exit(1);
    }

    const alerter = new Alerter();
    const metricsServer = new MetricsServer(alerter, port);
    const healthChecker = new HealthChecker(rpcUrl, intervalSec, alerter);

    metricsServer.start();
    console.log(`[rpc-health-daemon] Monitoring ${rpcUrl}`);
    console.log(`[rpc-health-daemon] Health check interval: ${intervalSec}s`);
    console.log(`[rpc-health-daemon] Metrics server listening on port ${port}`);

    healthChecker.start();
  });

program.parse();
