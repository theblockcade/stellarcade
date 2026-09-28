/**
 * Bundle treemap generator: directory scanner, gzip/brotli estimation,
 * squarified treemap layout and a self-contained HTML report.
 *
 * No runtime dependencies: the scanner uses `node:fs`, the compression
 * estimates use `node:zlib`, and the report is a single HTML string with an
 * inline SVG plus the layout as JSON, so the file can be opened from disk or
 * attached to a PR without a server or a build step.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';
import * as path from 'node:path';
import type {
  FileEntry,
  ReportData,
  ReportOptions,
  Rect,
  ScanOptions,
  ScanResult,
  TreemapRect,
  TreeNode,
} from './types';

export const DEFAULT_IGNORE = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

/** Files above this are compressed from a sample instead of in full. */
export const DEFAULT_SAMPLE_ABOVE = 2 * 1024 * 1024;

/** Hard cap so a runaway directory cannot produce a gigabyte of JSON. */
export const DEFAULT_MAX_FILES = 20_000;

/** Bytes fed to gzip/brotli for oversized files. */
export const SAMPLE_BYTES = 256 * 1024;

export function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Estimate what a file costs over the wire.
 *
 * Files above `sampleAboveBytes` are compressed from their first
 * {@link SAMPLE_BYTES} bytes and scaled up, which keeps the run fast on
 * multi-megabyte assets. The result is an estimate — the report says so.
 */
export function estimateCompression(
  content: Buffer,
  sampleAboveBytes: number = DEFAULT_SAMPLE_ABOVE
): { gzipSize: number; brotliSize: number; sampled: boolean } {
  if (content.length === 0) return { gzipSize: 0, brotliSize: 0, sampled: false };

  const sampled = content.length > sampleAboveBytes;
  const input = sampled ? content.subarray(0, SAMPLE_BYTES) : content;
  const ratio = sampled ? content.length / input.length : 1;

  const gzipSize = Math.round(gzipSync(input, { level: 9 }).length * ratio);
  const brotliSize = Math.round(
    brotliCompressSync(input, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
    }).length * ratio
  );

  // Compressed output can exceed the input for tiny or incompressible files;
  // report the smaller of the two so the numbers stay believable.
  return {
    gzipSize: Math.min(gzipSize, content.length),
    brotliSize: Math.min(brotliSize, content.length),
    sampled,
  };
}

/** Walk `root` and measure every file under it. */
export function scanDirectory(root: string, options: ScanOptions = {}): ScanResult {
  const ignore = new Set(options.ignore ?? DEFAULT_IGNORE);
  const sampleAboveBytes = options.sampleAboveBytes ?? DEFAULT_SAMPLE_ABOVE;
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;

  // A missing root is a user error, not an empty bundle: say so instead of
  // writing a report full of zeroes. Unreadable *sub*directories are still
  // skipped by `walk` below.
  try {
    if (!statSync(root).isDirectory()) throw new Error('not a directory');
  } catch (error) {
    const reason = (error as NodeJS.ErrnoException).code ?? (error as Error).message;
    throw new Error(
      reason === 'ENOENT'
        ? `directory does not exist: ${root}`
        : reason === 'not a directory'
          ? `not a directory: ${root}`
          : `cannot read ${root}: ${reason}`
    );
  }

  const files: FileEntry[] = [];
  let skipped = 0;

  const walk = (absolute: string, relative: string): void => {
    let entries;
    try {
      entries = readdirSync(absolute, { withFileTypes: true });
    } catch {
      return; // unreadable directory: skip it rather than failing the scan
    }

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const childAbsolute = path.join(absolute, entry.name);
      const childRelative = relative === '' ? entry.name : `${relative}/${entry.name}`;

      if (entry.isDirectory()) {
        if (ignore.has(entry.name)) continue;
        walk(childAbsolute, childRelative);
        continue;
      }
      if (!entry.isFile()) continue; // symlinks and sockets are not bundle weight

      if (files.length >= maxFiles) {
        skipped += 1;
        continue;
      }

      let size: number;
      try {
        size = statSync(childAbsolute).size;
      } catch {
        continue;
      }

      let content: Buffer;
      try {
        content = readFileSync(childAbsolute);
      } catch {
        content = Buffer.alloc(0);
      }

      const { gzipSize, brotliSize } = estimateCompression(content, sampleAboveBytes);
      files.push({ path: childRelative, size, gzipSize, brotliSize });
    }
  };

  walk(root, '');

  return {
    root,
    files,
    tree: buildTree(root, files),
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    totalGzip: files.reduce((sum, file) => sum + file.gzipSize, 0),
    totalBrotli: files.reduce((sum, file) => sum + file.brotliSize, 0),
    skipped,
  };
}

/** Turn a flat file list into a size tree, directories first. */
export function buildTree(root: string, files: FileEntry[]): TreeNode {
  const makeNode = (name: string, nodePath: string, isFile: boolean): TreeNode => ({
    name,
    path: nodePath,
    size: 0,
    gzipSize: 0,
    brotliSize: 0,
    fileCount: 0,
    children: [],
    isFile,
  });

  const rootNode = makeNode(path.basename(path.resolve(root)) || '(root)', '(root)', false);
  const directories = new Map<string, TreeNode>([['', rootNode]]);

  const ensureDirectory = (relativeDir: string): TreeNode => {
    if (relativeDir === '') return rootNode;
    const existing = directories.get(relativeDir);
    if (existing) return existing;

    const segments = relativeDir.split('/');
    const name = segments[segments.length - 1];
    const node = makeNode(name, relativeDir, false);
    directories.set(relativeDir, node);

    const parent = ensureDirectory(segments.slice(0, -1).join('/'));
    parent.children.push(node);
    return node;
  };

  for (const file of files) {
    const segments = file.path.split('/');
    const name = segments.pop() as string;
    const parent = ensureDirectory(segments.join('/'));
    parent.children.push({
      ...makeNode(name, file.path, true),
      size: file.size,
      gzipSize: file.gzipSize,
      brotliSize: file.brotliSize,
      fileCount: 1,
    });
  }

  const aggregate = (node: TreeNode): TreeNode => {
    if (node.isFile) return node;
    for (const child of node.children) aggregate(child);
    node.size = node.children.reduce((sum, child) => sum + child.size, 0);
    node.gzipSize = node.children.reduce((sum, child) => sum + child.gzipSize, 0);
    node.brotliSize = node.children.reduce((sum, child) => sum + child.brotliSize, 0);
    node.fileCount = node.children.reduce((sum, child) => sum + child.fileCount, 0);
    // Heaviest first: it is also the order the layout wants.
    node.children.sort((a, b) => b.size - a.size || a.name.localeCompare(b.name));
    return node;
  };

  return aggregate(rootNode);
}

/** Worst aspect ratio of laying `areas` along a side of length `side`. */
function worstRatio(areas: number[], side: number): number {
  const sum = areas.reduce((total, area) => total + area, 0);
  if (sum === 0) return Number.POSITIVE_INFINITY;
  const largest = Math.max(...areas);
  const smallest = Math.min(...areas);
  return Math.max((side * side * largest) / (sum * sum), (sum * sum) / (side * side * smallest));
}

/**
 * Squarified treemap layout (Bruls, Huizing & van Wijk).
 *
 * Rectangles are laid out in rows along the shorter side of the remaining
 * space, greedily keeping each row as square as possible. The returned area of
 * every rectangle is proportional to its size, and the rectangles tile `rect`
 * without overlapping.
 */
export function squarify(nodes: TreeNode[], rect: Rect): TreemapRect[] {
  const total = nodes.reduce((sum, node) => sum + node.size, 0);
  if (nodes.length === 0 || total <= 0 || rect.width <= 0 || rect.height <= 0) return [];

  const scale = (rect.width * rect.height) / total;
  const queue = nodes
    .map((node) => ({ node, area: node.size * scale }))
    .filter((entry) => entry.area > 0)
    .sort((a, b) => b.area - a.area);

  const placed: TreemapRect[] = [];
  let { x, y, width, height } = rect;
  let row: { node: TreeNode; area: number }[] = [];

  const flushRow = (): void => {
    if (row.length === 0) return;
    const rowArea = row.reduce((sum, entry) => sum + entry.area, 0);

    if (width >= height) {
      // Vertical strip on the left: items stacked top to bottom.
      const stripWidth = Math.min(rowArea / height, width);
      let offsetY = y;
      row.forEach((entry, index) => {
        const isLast = index === row.length - 1;
        const itemHeight = isLast ? y + height - offsetY : entry.area / stripWidth;
        placed.push({
          node: entry.node,
          x,
          y: offsetY,
          width: stripWidth,
          height: itemHeight,
        });
        offsetY += itemHeight;
      });
      x += stripWidth;
      width -= stripWidth;
    } else {
      // Horizontal strip on top: items left to right.
      const stripHeight = Math.min(rowArea / width, height);
      let offsetX = x;
      row.forEach((entry, index) => {
        const isLast = index === row.length - 1;
        const itemWidth = isLast ? x + width - offsetX : entry.area / stripHeight;
        placed.push({
          node: entry.node,
          x: offsetX,
          y,
          width: itemWidth,
          height: stripHeight,
        });
        offsetX += itemWidth;
      });
      y += stripHeight;
      height -= stripHeight;
    }
    row = [];
  };

  for (const entry of queue) {
    const side = Math.min(width, height);
    const candidate = [...row.map((item) => item.area), entry.area];
    if (row.length === 0 || worstRatio(candidate, side) <= worstRatio(row.map((item) => item.area), side)) {
      row.push(entry);
    } else {
      flushRow();
      row.push(entry);
    }
  }
  flushRow();

  return placed;
}

/** Stable colour per path so the same file is the same colour in every run. */
export function colorFor(nodePath: string): string {
  let hash = 0;
  for (let index = 0; index < nodePath.length; index += 1) {
    hash = (hash * 31 + nodePath.charCodeAt(index)) % 360;
  }
  return `hsl(${hash}, 62%, 58%)`;
}

/**
 * A layout per directory, in fractions of that directory's box.
 *
 * Fractions rather than pixels keep the report zoomable: the browser maps them
 * onto whatever rectangle is currently on screen, so drill-down needs no
 * re-layout on the client.
 */
export function layoutByDirectory(
  tree: TreeNode,
  limit = 400
): Record<string, { path: string; name: string; size: number; isFile: boolean; x: number; y: number; width: number; height: number; color: string; childCount: number }[]> {
  const layouts: Record<string, ReturnType<typeof layoutByDirectory>[string]> = {};

  const walk = (node: TreeNode, depth: number): void => {
    if (node.isFile || depth > 8 || node.children.length === 0) return;
    const rects = squarify(node.children, { x: 0, y: 0, width: 1, height: 1 });
    layouts[node.path] = rects.map((entry) => ({
      path: entry.node.path,
      name: entry.node.name,
      size: entry.node.size,
      isFile: entry.node.isFile,
      x: Number(entry.x.toFixed(6)),
      y: Number(entry.y.toFixed(6)),
      width: Number(entry.width.toFixed(6)),
      height: Number(entry.height.toFixed(6)),
      color: colorFor(entry.node.path),
      childCount: entry.node.children.length,
    }));
    if (Object.keys(layouts).length > limit) return;
    for (const child of node.children) walk(child, depth + 1);
  };

  walk(tree, 0);
  return layouts;
}

/** Heaviest files first, for the CLI summary and the report side bar. */
export function heaviestFiles(files: FileEntry[], top = 10): FileEntry[] {
  return [...files].sort((a, b) => b.size - a.size).slice(0, top);
}

export function buildReport(result: ScanResult, options: ReportOptions = {}): ReportData {
  return {
    root: result.root,
    generatedAt: new Date().toISOString(),
    width: options.width ?? 960,
    height: options.height ?? 600,
    totalSize: result.totalSize,
    totalGzip: result.totalGzip,
    totalBrotli: result.totalBrotli,
    fileCount: result.files.length,
    heaviest: heaviestFiles(result.files, options.top ?? 10),
    tree: result.tree,
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return 'n/a';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

/**
 * The whole report as one HTML string: inline styles, inline SVG and the layout
 * data as JSON. No script or stylesheet is fetched from anywhere.
 */
export function generateHtml(report: ReportData, layouts = layoutByDirectory(report.tree)): string {
  const heaviestRows = report.heaviest
    .map(
      (file) =>
        `<tr><td class="path" title="${escapeHtml(file.path)}">${escapeHtml(file.path)}</td>` +
        `<td class="num">${formatBytes(file.size)}</td>` +
        `<td class="num">${formatBytes(file.gzipSize)}</td>` +
        `<td class="num">${formatBytes(file.brotliSize)}</td></tr>`
    )
    .join('\n');

  const data = JSON.stringify({
    root: report.tree.path,
    rootName: report.tree.name,
    rootLabel: report.root,
    generatedAt: report.generatedAt,
    totalSize: report.totalSize,
    totalGzip: report.totalGzip,
    totalBrotli: report.totalBrotli,
    fileCount: report.fileCount,
    layouts,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bundle treemap — ${escapeHtml(report.root)}</title>
<style>
:root { color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; font: 14px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1020; color: #e6e9f2; }
header { padding: 18px 22px 12px; border-bottom: 1px solid #1e2742; }
h1 { margin: 0 0 6px; font-size: 18px; }
.summary { display: flex; gap: 22px; flex-wrap: wrap; color: #9aa7c7; font-size: 13px; }
.summary b { color: #e6e9f2; font-weight: 600; }
main { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 18px; padding: 18px 22px 28px; }
@media (max-width: 900px) { main { grid-template-columns: minmax(0, 1fr); } }
.breadcrumb { margin-bottom: 10px; font-size: 13px; color: #9aa7c7; }
.breadcrumb button { background: #16203a; color: #cfe0ff; border: 1px solid #26314f; border-radius: 6px; padding: 3px 9px; margin-right: 6px; cursor: pointer; font-size: 12px; }
.breadcrumb button:hover { background: #1d2947; }
svg { width: 100%; height: auto; display: block; background: #0f1630; border: 1px solid #1e2742; border-radius: 10px; }
rect.cell { stroke: #0b1020; stroke-width: 0.4; cursor: pointer; }
rect.cell:hover { stroke: #ffffff; stroke-width: 1.2; }
text.label { fill: #08101f; font-size: 10px; pointer-events: none; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { text-align: left; padding: 5px 7px; border-bottom: 1px solid #1a2338; }
th { color: #9aa7c7; font-weight: 600; }
td.num { text-align: right; white-space: nowrap; }
td.path { max-width: 210px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
h2 { font-size: 14px; margin: 0 0 8px; }
#tooltip { position: fixed; pointer-events: none; background: #131c33; border: 1px solid #2a365a; border-radius: 8px; padding: 7px 10px; font-size: 12px; box-shadow: 0 10px 25px rgba(0,0,0,.45); opacity: 0; transition: opacity .12s; z-index: 10; }
footer { padding: 0 22px 22px; color: #6f7c9c; font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>Bundle treemap — ${escapeHtml(report.root)}</h1>
  <div class="summary">
    <span>files <b>${report.fileCount}</b></span>
    <span>on disk <b>${formatBytes(report.totalSize)}</b></span>
    <span>gzip <b>${formatBytes(report.totalGzip)}</b></span>
    <span>brotli <b>${formatBytes(report.totalBrotli)}</b></span>
    <span>generated <b>${escapeHtml(report.generatedAt)}</b></span>
  </div>
</header>
<main>
  <section>
    <div class="breadcrumb" id="breadcrumb"></div>
    <svg id="treemap" viewBox="0 0 ${report.width} ${report.height}" role="img" aria-label="Bundle size treemap"></svg>
  </section>
  <aside>
    <h2>Heaviest files (on disk)</h2>
    <table>
      <thead><tr><th>path</th><th class="num">size</th><th class="num">gzip</th><th class="num">brotli</th></tr></thead>
      <tbody>
${heaviestRows}
      </tbody>
    </table>
  </aside>
</main>
<footer>Sizes are measured on disk; gzip and brotli are estimates (files above the sample threshold are compressed from a sample and scaled). Click a rectangle to drill in, click the breadcrumb to go back.</footer>
<div id="tooltip" role="status" aria-live="polite"></div>
<script>
const DATA = ${data.replace(/</g, '\\u003c')};
const SVG_NS = 'http://www.w3.org/2000/svg';
const WIDTH = ${report.width};
const HEIGHT = ${report.height};
const svg = document.getElementById('treemap');
const breadcrumb = document.getElementById('breadcrumb');
const tooltip = document.getElementById('tooltip');
let currentPath = DATA.root;

function human(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024, unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return value.toFixed(value >= 10 ? 0 : 1) + ' ' + units[unit];
}

function draw(path) {
  currentPath = path;
  const cells = DATA.layouts[path] || [];
  svg.innerHTML = '';
  for (const cell of cells) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('class', 'cell');
    rect.setAttribute('x', (cell.x * WIDTH).toFixed(2));
    rect.setAttribute('y', (cell.y * HEIGHT).toFixed(2));
    rect.setAttribute('width', (cell.width * WIDTH).toFixed(2));
    rect.setAttribute('height', (cell.height * HEIGHT).toFixed(2));
    rect.setAttribute('fill', cell.color);
    rect.dataset.path = cell.path;
    rect.dataset.file = String(cell.isFile);
    rect.dataset.size = String(cell.size);
    rect.dataset.name = cell.name;
    rect.dataset.childCount = String(cell.childCount);
    svg.appendChild(rect);

    const widthPx = cell.width * WIDTH;
    const heightPx = cell.height * HEIGHT;
    if (widthPx > 54 && heightPx > 14) {
      const label = document.createElementNS(SVG_NS, 'text');
      label.setAttribute('class', 'label');
      label.setAttribute('x', (cell.x * WIDTH + 4).toFixed(2));
      label.setAttribute('y', (cell.y * HEIGHT + 12).toFixed(2));
      label.textContent = cell.name.length > Math.floor(widthPx / 6) ? cell.name.slice(0, Math.max(3, Math.floor(widthPx / 6))) + '…' : cell.name;
      svg.appendChild(label);
    }
  }
  drawBreadcrumb(path);
}

function drawBreadcrumb(path) {
  breadcrumb.innerHTML = '';
  const back = document.createElement('button');
  back.textContent = '← back';
  back.disabled = path === DATA.root;
  back.onclick = () => { const parent = path.split('/').slice(0, -1).join('/'); draw(parent === '' ? DATA.root : parent); };
  breadcrumb.appendChild(back);
  const label = document.createElement('span');
  label.textContent = (path === DATA.root ? DATA.rootLabel : path) + ' — ' + (DATA.layouts[path] || []).length + ' items';
  breadcrumb.appendChild(label);
}

svg.addEventListener('mousemove', (event) => {
  const target = event.target;
  if (!target.dataset || !target.dataset.name) { tooltip.style.opacity = '0'; return; }
  tooltip.textContent = target.dataset.name + ' · ' + human(Number(target.dataset.size)) +
    (target.dataset.file === 'true' ? '' : ' · ' + target.dataset.childCount + ' entries · click to drill in');
  tooltip.style.left = Math.min(event.clientX + 14, window.innerWidth - 260) + 'px';
  tooltip.style.top = (event.clientY + 16) + 'px';
  tooltip.style.opacity = '1';
});

svg.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });

svg.addEventListener('click', (event) => {
  const target = event.target;
  if (!target.dataset || target.dataset.file !== 'false') return;
  if (DATA.layouts[target.dataset.path]) draw(target.dataset.path);
});

draw(DATA.root);
</script>
</body>
</html>
`;
}
