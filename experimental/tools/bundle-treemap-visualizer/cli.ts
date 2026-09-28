#!/usr/bin/env node
/**
 * bundle-treemap-visualizer — scan a directory and write a standalone treemap
 * report of what it weighs.
 *
 * Usage:
 *   bundle-treemap-visualizer --dir ./packages/app --out report.html [--open]
 *
 * Flags are parsed by hand: the tool has no runtime dependencies, and two
 * options do not justify a framework.
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import {
  buildReport,
  formatBytes,
  generateHtml,
  heaviestFiles,
  layoutByDirectory,
  scanDirectory,
} from './treemapGenerator';
import type { ScanOptions } from './types';

export interface CliOptions {
  dir: string;
  out: string;
  open: boolean;
  /** Report size in SVG units. */
  width?: number;
  height?: number;
  /** How many files the summary lists. */
  top: number;
  /** Directory names to skip. */
  ignore?: string[];
  help: boolean;
}

export const USAGE = `bundle-treemap-visualizer — standalone bundle size treemap

Usage:
  bundle-treemap-visualizer --dir <path> [--out <report.html>] [--open]
  bundle-treemap-visualizer --dir <path> --width 1200 --height 800 --top 20

Options:
  --dir <path>      directory to scan (default: current directory)
  --out <file>      where to write the report (default: bundle-treemap.html)
  --open            open the report in the default browser when it is written
  --width <px>      report width in SVG units (default: 960)
  --height <px>     report height in SVG units (default: 600)
  --top <n>         how many heaviest files to list (default: 10)
  --ignore <names>  comma-separated directory names to skip
  --help            print this help

The report is a single self-contained HTML file: no server, no build step, no
network access when you open it.`;

/** Parse `process.argv`-style input without a dependency. */
export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dir: '.',
    out: 'bundle-treemap.html',
    open: false,
    top: 10,
    help: false,
  };
  const unknown: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = (): string => {
      const inline = arg.includes('=') ? arg.slice(arg.indexOf('=') + 1) : undefined;
      if (inline !== undefined) return inline;
      index += 1;
      const next = argv[index];
      if (next === undefined || next.startsWith('--')) {
        throw new Error(`${arg.split('=')[0]} needs a value`);
      }
      return next;
    };

    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--open') options.open = true;
    else if (arg.startsWith('--dir')) options.dir = value();
    else if (arg.startsWith('--out')) options.out = value();
    else if (arg.startsWith('--width')) options.width = Number(value());
    else if (arg.startsWith('--height')) options.height = Number(value());
    else if (arg.startsWith('--top')) options.top = Number(value());
    else if (arg.startsWith('--ignore')) options.ignore = value().split(',').map((name) => name.trim()).filter(Boolean);
    else unknown.push(arg);
  }

  if (unknown.length > 0) throw new Error(`unknown option(s): ${unknown.join(', ')}`);
  if (!Number.isFinite(options.top) || options.top <= 0) throw new Error('--top must be a positive number');
  for (const numeric of ['width', 'height'] as const) {
    const value = options[numeric];
    if (value !== undefined && (!Number.isFinite(value) || value <= 0)) {
      throw new Error(`--${numeric} must be a positive number`);
    }
  }
  return options;
}

/** Open a file with the platform's default handler, best effort. */
export function openFile(file: string): void {
  const command =
    process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  try {
    const child = spawn(command, [file], { detached: true, stdio: 'ignore', shell: process.platform === 'win32' });
    child.unref();
  } catch {
    // Opening the browser is a convenience; failing to do so is not an error.
  }
}

/** One aligned row per file: path, on-disk size, gzip, brotli. */
export function formatSummary(
  files: { path: string; size: number; gzipSize: number; brotliSize: number }[],
  top = 10
): string {
  const rows = heaviestFiles(files, top);
  if (rows.length === 0) return '  (no files found)';

  const width = Math.min(60, Math.max(...rows.map((row) => row.path.length)));
  const lines = rows.map((row) => {
    const shown = row.path.length > width ? `…${row.path.slice(-(width - 1))}` : row.path;
    return (
      `  ${shown.padEnd(width)}  ${formatBytes(row.size).padStart(9)}` +
      `  gzip ${formatBytes(row.gzipSize).padStart(9)}` +
      `  brotli ${formatBytes(row.brotliSize).padStart(9)}`
    );
  });
  return lines.join('\n');
}

export function run(argv: string[], write = writeFileSync): number {
  let options: CliOptions;
  try {
    options = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`error: ${(error as Error).message}\n\n${USAGE}\n`);
    return 2;
  }

  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return 0;
  }

  const root = path.resolve(options.dir);
  const scanOptions: ScanOptions = {};
  if (options.ignore) scanOptions.ignore = options.ignore;

  let result;
  try {
    result = scanDirectory(root, scanOptions);
  } catch (error) {
    process.stderr.write(`error: cannot scan ${root}: ${(error as Error).message}\n`);
    return 1;
  }

  const report = buildReport(result, {
    width: options.width,
    height: options.height,
    top: options.top,
  });
  const html = generateHtml(report, layoutByDirectory(report.tree));

  const outPath = path.resolve(options.out);
  mkdirSync(path.dirname(outPath), { recursive: true });
  write(outPath, html, 'utf8');

  process.stdout.write(
    `${root}\n` +
      `  files: ${report.fileCount}${result.skipped > 0 ? ` (${result.skipped} skipped by the file cap)` : ''}\n` +
      `  on disk: ${formatBytes(report.totalSize)} | gzip ~${formatBytes(report.totalGzip)} | ` +
      `brotli ~${formatBytes(report.totalBrotli)}\n` +
      `  heaviest ${Math.min(options.top, report.heaviest.length)} files:\n` +
      `${formatSummary(report.heaviest, options.top)}\n` +
      `  report: ${outPath}\n`
  );

  if (options.open) openFile(outPath);
  return 0;
}

if (require.main === module) {
  process.exit(run(process.argv.slice(2)));
}
