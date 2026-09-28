import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buildReport,
  buildTree,
  colorFor,
  estimateCompression,
  formatBytes,
  generateHtml,
  heaviestFiles,
  layoutByDirectory,
  scanDirectory,
  squarify,
} from './treemapGenerator';
import { formatSummary, parseArgs, run } from './cli';
import type { FileEntry, TreeNode } from './types';

/** A directory tree with known byte counts, built once for the whole suite. */
let fixture: string;
const FIXTURE_FILES: Record<string, number> = {
  'index.js': 1200,
  'package.json': 300,
  'src/app.js': 4000,
  'src/util/helpers.js': 800,
  'src/util/legacy.js': 0,
  'assets/logo.svg': 2500,
  'node_modules/dep/index.js': 999999,
  'dist/bundle.js': 777777,
};

function fileOfSize(file: string, bytes: number): void {
  mkdirSync(path.dirname(file), { recursive: true });
  // Repetitive content so gzip/brotli have something to actually compress.
  writeFileSync(file, 'const value = 42;\n'.repeat(Math.ceil(bytes / 17)).slice(0, bytes));
}

beforeAll(() => {
  fixture = mkdtempSync(path.join(tmpdir(), 'treemap-fixture-'));
  for (const [relative, bytes] of Object.entries(FIXTURE_FILES)) {
    fileOfSize(path.join(fixture, relative), bytes);
  }
});

afterAll(() => {
  rmSync(fixture, { recursive: true, force: true });
});

describe('scanDirectory', () => {
  it('computes accurate directory size totals', () => {
    const result = scanDirectory(fixture);

    const expected = Object.entries(FIXTURE_FILES)
      .filter(([relative]) => !relative.startsWith('node_modules/') && !relative.startsWith('dist/'))
      .reduce((sum, [, bytes]) => sum + bytes, 0);

    expect(result.totalSize).toBe(expected);
    expect(result.files.length).toBe(6);
    expect(result.skipped).toBe(0);

    // Every scanned file is accounted for exactly once.
    const bySize = result.files.reduce((sum, file) => sum + file.size, 0);
    expect(bySize).toBe(expected);

    // Paths are POSIX-relative to the scanned root.
    for (const file of result.files) {
      expect(file.path).not.toContain('\\');
      expect(file.path.startsWith('/')).toBe(false);
    }
  });

  it('aggregates the tree from the leaves up and sorts heaviest first', () => {
    const result = scanDirectory(fixture);
    const { tree } = result;

    expect(tree.size).toBe(result.totalSize);
    expect(tree.fileCount).toBe(result.files.length);
    expect(tree.isFile).toBe(false);

    const src = tree.children.find((child) => child.name === 'src');
    expect(src).toBeDefined();
    expect(src?.size).toBe(4000 + 800 + 0);
    expect(src?.fileCount).toBe(3);
    expect(src?.children[0].name).toBe('app.js'); // 4000 > 800 > 0
    expect(src?.children[0].isFile).toBe(true);

    const sizes = tree.children.map((child) => child.size);
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));

    const util = src?.children.find((child) => child.name === 'util');
    expect(util?.children.map((child) => child.name)).toEqual(['helpers.js', 'legacy.js']);
  });

  it('honours the ignore list and the file cap', () => {
    const ignored = scanDirectory(fixture, { ignore: ['node_modules', 'dist', 'assets'] });
    expect(ignored.files.some((file) => file.path.startsWith('assets/'))).toBe(false);
    expect(ignored.totalSize).toBe(1200 + 300 + 4000 + 800);

    const capped = scanDirectory(fixture, { maxFiles: 2 });
    expect(capped.files.length).toBe(2);
    expect(capped.skipped).toBe(4);
  });

  it('estimates compression for every file and never exceeds the raw size', () => {
    const result = scanDirectory(fixture);
    for (const file of result.files) {
      expect(file.gzipSize).toBeGreaterThanOrEqual(0);
      expect(file.brotliSize).toBeGreaterThanOrEqual(0);
      expect(file.gzipSize).toBeLessThanOrEqual(file.size);
      expect(file.brotliSize).toBeLessThanOrEqual(file.size);
    }
    // Repetitive source compresses well.
    const index = result.files.find((file) => file.path === 'index.js');
    expect(index?.gzipSize).toBeLessThan((index as FileEntry).size);
    expect(result.totalGzip).toBeLessThan(result.totalSize);
  });

  it('returns an empty tree for a directory with no files', () => {
    const empty = mkdtempSync(path.join(tmpdir(), 'treemap-empty-'));
    try {
      const result = scanDirectory(empty);
      expect(result.files).toEqual([]);
      expect(result.totalSize).toBe(0);
      expect(result.tree.children).toEqual([]);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});

describe('estimateCompression', () => {
  it('compresses repetitive text to a fraction of its size', () => {
    const content = Buffer.from('aaaaaaaaaa'.repeat(2000));
    const { gzipSize, brotliSize, sampled } = estimateCompression(content);
    expect(sampled).toBe(false);
    expect(gzipSize).toBeGreaterThan(0);
    expect(gzipSize).toBeLessThan(content.length / 10);
    expect(brotliSize).toBeGreaterThan(0);
    expect(brotliSize).toBeLessThanOrEqual(gzipSize);
  });

  it('never reports more than the raw size and handles empty input', () => {
    const tiny = Buffer.from([0x00, 0x01, 0x02, 0x03]);
    const { gzipSize, brotliSize } = estimateCompression(tiny);
    expect(gzipSize).toBeLessThanOrEqual(tiny.length);
    expect(brotliSize).toBeLessThanOrEqual(tiny.length);

    expect(estimateCompression(Buffer.alloc(0))).toEqual({ gzipSize: 0, brotliSize: 0, sampled: false });
  });

  it('samples oversized files instead of reading them whole', () => {
    const big = Buffer.from('abcdefgh'.repeat(64 * 1024)); // 512 KiB of repeated text
    const { sampled, gzipSize } = estimateCompression(big, 1024);
    expect(sampled).toBe(true);
    expect(gzipSize).toBeGreaterThan(0);
    expect(gzipSize).toBeLessThanOrEqual(big.length);
  });
});

describe('squarify', () => {
  const node = (name: string, size: number): TreeNode => ({
    name,
    path: name,
    size,
    gzipSize: size,
    brotliSize: size,
    fileCount: 1,
    children: [],
    isFile: true,
  });

  const overlaps = (
    a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }
  ): boolean => {
    const epsilon = 1e-6;
    const xOverlap = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
    const yOverlap = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
    return xOverlap > epsilon && yOverlap > epsilon;
  };

  it('partitions the rectangle: every cell is inside, nothing overlaps, area is proportional', () => {
    const nodes = [node('a', 60), node('b', 25), node('c', 10), node('d', 5)];
    const rect = { x: 0, y: 0, width: 100, height: 60 };
    const placed = squarify(nodes, rect);

    expect(placed).toHaveLength(4);

    let area = 0;
    for (const cell of placed) {
      expect(cell.x).toBeGreaterThanOrEqual(rect.x - 1e-9);
      expect(cell.y).toBeGreaterThanOrEqual(rect.y - 1e-9);
      expect(cell.x + cell.width).toBeLessThanOrEqual(rect.x + rect.width + 1e-6);
      expect(cell.y + cell.height).toBeLessThanOrEqual(rect.y + rect.height + 1e-6);
      expect(cell.width).toBeGreaterThan(0);
      expect(cell.height).toBeGreaterThan(0);
      area += cell.width * cell.height;
    }

    // The cells tile the whole rectangle.
    expect(area).toBeCloseTo(rect.width * rect.height, 4);

    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        expect(overlaps(placed[i], placed[j])).toBe(false);
      }
    }

    // Area share matches the size share, in the same order.
    const totalSize = nodes.reduce((sum, item) => sum + item.size, 0);
    const totalArea = rect.width * rect.height;
    const byName = new Map(placed.map((cell) => [cell.node.name, cell]));
    for (const item of nodes) {
      const cell = byName.get(item.name) as (typeof placed)[number];
      const expected = (item.size / totalSize) * totalArea;
      expect(cell.width * cell.height).toBeCloseTo(expected, 4);
    }
    expect(placed[0].node.name).toBe('a'); // heaviest first
  });

  it('lays out the same set the same way twice (stable output)', () => {
    const nodes = [node('a', 7), node('b', 3), node('c', 2)];
    const rect = { x: 5, y: 5, width: 200, height: 120 };
    expect(squarify(nodes, rect)).toEqual(squarify([...nodes].reverse(), rect));
  });

  it('produces squares-ish cells for equal weights and handles degenerate input', () => {
    const equal = squarify([node('a', 1), node('b', 1), node('c', 1), node('d', 1)], {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });
    expect(equal).toHaveLength(4);
    const areas = equal.map((cell) => cell.width * cell.height);
    for (const area of areas) expect(area).toBeCloseTo(2500, 4);

    expect(squarify([], { x: 0, y: 0, width: 10, height: 10 })).toEqual([]);
    expect(squarify([node('zero', 0)], { x: 0, y: 0, width: 10, height: 10 })).toEqual([]);
    expect(squarify([node('a', 5)], { x: 0, y: 0, width: 0, height: 10 })).toEqual([]);
  });

  it('handles a lopsided distribution without leaving holes', () => {
    const nodes = [node('big', 1000), node('small', 1), node('tiny', 1)];
    const rect = { x: 0, y: 0, width: 300, height: 200 };
    const placed = squarify(nodes, rect);
    const area = placed.reduce((sum, cell) => sum + cell.width * cell.height, 0);
    expect(area).toBeCloseTo(300 * 200, 3);
    expect(placed).toHaveLength(3);
  });
});

describe('layoutByDirectory', () => {
  it('returns fractions of each directory box within [0, 1]', () => {
    const tree = buildTree('/project', [
      { path: 'src/a.js', size: 100, gzipSize: 50, brotliSize: 40 },
      { path: 'src/b.js', size: 50, gzipSize: 30, brotliSize: 25 },
      { path: 'docs/readme.md', size: 10, gzipSize: 8, brotliSize: 7 },
    ]);
    const layouts = layoutByDirectory(tree);

    expect(Object.keys(layouts).sort()).toEqual(['(root)', 'docs', 'src']);
    for (const cells of Object.values(layouts)) {
      for (const cell of cells) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.x + cell.width).toBeLessThanOrEqual(1.000001);
        expect(cell.y + cell.height).toBeLessThanOrEqual(1.000001);
        expect(cell.color).toMatch(/^hsl\(\d+, 62%, 58%\)$/);
      }
    }

    const rootCells = layouts['(root)'];
    const totalFraction = rootCells.reduce((sum, cell) => sum + cell.width * cell.height, 0);
    expect(totalFraction).toBeCloseTo(1, 3);
  });
});

describe('heaviestFiles / formatBytes / colorFor', () => {
  it('lists the heaviest files first and caps the list', () => {
    const files: FileEntry[] = [100, 900, 400, 50].map((size, index) => ({
      path: `f${index}`,
      size,
      gzipSize: size / 2,
      brotliSize: size / 3,
    }));
    expect(heaviestFiles(files, 2).map((file) => file.path)).toEqual(['f1', 'f2']);
    expect(heaviestFiles(files, 10)).toHaveLength(4);
  });

  it('formats byte sizes for humans', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(20 * 1024 * 1024)).toBe('20 MB');
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe('3.0 GB');
  });

  it('is deterministic per path and varies between paths', () => {
    expect(colorFor('src/app.js')).toBe(colorFor('src/app.js'));
    expect(colorFor('src/app.js')).not.toBe(colorFor('src/other.js'));
  });
});

describe('generateHtml', () => {
  it('creates valid HTML5 with an embedded SVG and no external references', () => {
    const result = scanDirectory(fixture);
    const report = buildReport(result, { top: 5 });
    const html = generateHtml(report);

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<svg id="treemap"');
    expect(html).toContain('</html>');

    // Self-contained: no external scripts, stylesheets, fonts or images.
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+stylesheet/i);
    expect(html).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);

    // The layout data is embedded and parses back to the same directory set.
    const embedded = html.slice(html.indexOf('const DATA = ') + 'const DATA = '.length);
    const json = embedded.slice(0, embedded.indexOf(';\nconst SVG_NS'));
    const data = JSON.parse(json) as {
      root: string;
      fileCount: number;
      layouts: Record<string, { name: string; size: number }[]>;
    };
    expect(data.root).toBe('(root)');
    expect(data.fileCount).toBe(result.files.length);
    expect(Object.keys(data.layouts)).toContain('(root)');
    expect(Object.keys(data.layouts)).toContain('src');

    // The heaviest-files table lists what the report says it lists.
    for (const file of report.heaviest) {
      expect(html).toContain(file.path);
    }
    expect(html).toContain('Heaviest files (on disk)');
    // The report states that the compressed numbers are estimates.
    expect(html.toLowerCase()).toContain('estimate');
  });

  it('escapes file names so a hostile path cannot break out of the markup', () => {
    const tree = buildTree('/project', [
      { path: 'evil<script>alert(1)</script>.js', size: 10, gzipSize: 5, brotliSize: 4 },
      { path: 'quote".js', size: 6, gzipSize: 3, brotliSize: 2 },
    ]);
    const html = generateHtml({
      root: '/project',
      generatedAt: '2026-01-01T00:00:00.000Z',
      width: 100,
      height: 100,
      totalSize: 16,
      totalGzip: 8,
      totalBrotli: 6,
      fileCount: 2,
      heaviest: [
        { path: 'evil<script>alert(1)</script>.js', size: 10, gzipSize: 5, brotliSize: 4 },
      ],
      tree,
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    // The JSON payload escapes `<` so the parser cannot be confused either.
    const embedded = html.slice(html.indexOf('const DATA = '));
    expect(embedded).not.toContain('evil<script>');
    expect(embedded).toContain('\\u003c');
  });

  it('renders an empty tree without throwing', () => {
    const tree = buildTree('/empty', []);
    const html = generateHtml({
      root: '/empty',
      generatedAt: '2026-01-01T00:00:00.000Z',
      width: 10,
      height: 10,
      totalSize: 0,
      totalGzip: 0,
      totalBrotli: 0,
      fileCount: 0,
      heaviest: [],
      tree,
    });
    expect(html).toContain('<svg id="treemap"');
    expect(html).toContain('</html>');
  });
});

describe('cli', () => {
  it('parses the documented flags, in both spaced and inline form', () => {
    expect(parseArgs(['--dir', './app', '--out', 'report.html', '--open'])).toMatchObject({
      dir: './app',
      out: 'report.html',
      open: true,
      top: 10,
      help: false,
    });
    expect(parseArgs(['--dir=./app', '--top=5', '--width=1200', '--height=800'])).toMatchObject({
      dir: './app',
      top: 5,
      width: 1200,
      height: 800,
    });
    expect(parseArgs(['--ignore', 'node_modules,.git']).ignore).toEqual(['node_modules', '.git']);
    expect(parseArgs(['--help']).help).toBe(true);
  });

  it('rejects unknown flags and missing values', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/unknown option/);
    expect(() => parseArgs(['--dir'])).toThrow(/needs a value/);
    expect(() => parseArgs(['--top', 'zero'])).toThrow(/--top/);
  });

  it('writes a report and prints the heaviest files', () => {
    const out = path.join(mkdtempSync(path.join(tmpdir(), 'treemap-out-')), 'nested/report.html');
    const printed: string[] = [];
    const original = process.stdout.write.bind(process.stdout);
    // Capture stdout without losing the real one for vitest's reporter.
    (process.stdout as unknown as { write: (chunk: string) => boolean }).write = (chunk: string) => {
      printed.push(chunk);
      return true;
    };
    let code: number;
    try {
      code = run(['--dir', fixture, '--out', out, '--top', '3']);
    } finally {
      (process.stdout as unknown as { write: typeof original }).write = original;
    }

    expect(code).toBe(0);
    expect(existsSync(out)).toBe(true);

    const summary = printed.join('');
    expect(summary).toContain('heaviest 3 files');
    expect(summary).toContain('index.js');
    expect(summary).not.toContain('node_modules');
    expect(summary).toContain('report:');

    const html = readFileSync(out, 'utf8');
    expect(html).toContain('<svg id="treemap"');

    rmSync(path.dirname(path.dirname(out)), { recursive: true, force: true });
  });

  it('returns a non-zero code and a clear message for bad input', () => {
    const errors: string[] = [];
    const originalErr = process.stderr.write.bind(process.stderr);
    (process.stderr as unknown as { write: (chunk: string) => boolean }).write = (chunk: string) => {
      errors.push(chunk);
      return true;
    };
    let code: number;
    try {
      code = run(['--dir', path.join(tmpdir(), 'definitely-missing-treemap-dir')]);
    } finally {
      (process.stderr as unknown as { write: typeof originalErr }).write = originalErr;
    }
    expect(code).toBe(1);
    expect(errors.join('')).toContain('cannot scan');
    expect(errors.join('')).toContain('definitely-missing-treemap-dir');
    // A missing directory must not leave a report behind.
    expect(existsSync('bundle-treemap.html')).toBe(false);
  });

  it('formats the CLI summary with the file count it was given', () => {
    const summary = formatSummary(
      [
        { path: 'a.js', size: 2048, gzipSize: 1024, brotliSize: 512 },
        { path: 'b.js', size: 1024, gzipSize: 512, brotliSize: 256 },
      ],
      10
    );
    expect(summary.split('\n')).toHaveLength(2);
    expect(summary).toContain('2.0 KB');
    expect(summary).toContain('gzip');
    expect(summary).toContain('brotli');
    expect(formatSummary([], 10)).toBe('  (no files found)');
  });
});
