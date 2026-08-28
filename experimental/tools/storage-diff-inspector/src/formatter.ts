import chalk from 'chalk';
import { StorageDiffEntry, StorageDiffResult } from './diff-engine';

function formatValue(value: any): string {
  if (value === undefined) return '—';
  return typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value);
}

/** Formats one diff entry as a single terminal line with ANSI color:
 * green for Added, red for Removed, yellow for Modified (before -> after). */
export function formatEntryAnsi(entry: StorageDiffEntry): string {
  const durabilityTag = chalk.dim(`[${entry.durability}]`);

  switch (entry.kind) {
    case 'added':
      return chalk.green(`+ ${entry.key}`) + ` ${durabilityTag} = ${formatValue(entry.after)} (${entry.afterType})`;
    case 'removed':
      return chalk.red(`- ${entry.key}`) + ` ${durabilityTag} = ${formatValue(entry.before)} (${entry.beforeType})`;
    case 'modified':
      return (
        chalk.yellow(`~ ${entry.key}`) +
        ` ${durabilityTag} ` +
        chalk.red(formatValue(entry.before)) +
        ' -> ' +
        chalk.green(formatValue(entry.after))
      );
  }
}

/** Renders the full diff as a terminal ANSI report, or a one-line
 * "No storage changes detected" message when the snapshots are identical. */
export function formatDiffAnsi(result: StorageDiffResult): string {
  if (!result.hasChanges) {
    return chalk.dim('No storage changes detected');
  }

  const lines = result.entries.map(formatEntryAnsi);
  const summary = chalk.bold(
    `${result.addedCount} added, ${result.modifiedCount} modified, ${result.removedCount} removed`,
  );

  return [summary, '', ...lines].join('\n');
}

/** Renders the diff as a Markdown table, suitable for a PR comment or a
 * saved report file. */
export function formatDiffMarkdown(result: StorageDiffResult): string {
  if (!result.hasChanges) {
    return 'No storage changes detected.';
  }

  const header = '| Change | Key | Durability | Before | After |\n|---|---|---|---|---|';
  const kindLabel: Record<StorageDiffEntry['kind'], string> = {
    added: '➕ Added',
    removed: '➖ Removed',
    modified: '✏️ Modified',
  };

  const rows = result.entries.map(
    (e) =>
      `| ${kindLabel[e.kind]} | \`${e.key}\` | ${e.durability} | ${formatValue(e.before)} | ${formatValue(e.after)} |`,
  );

  const summary = `**${result.addedCount} added, ${result.modifiedCount} modified, ${result.removedCount} removed**`;

  return [summary, '', header, ...rows].join('\n');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Renders the diff as a minimal, self-contained HTML report. */
export function formatDiffHtml(result: StorageDiffResult): string {
  const rowClass: Record<StorageDiffEntry['kind'], string> = {
    added: 'diff-added',
    removed: 'diff-removed',
    modified: 'diff-modified',
  };

  const rows = result.entries
    .map(
      (e) =>
        `<tr class="${rowClass[e.kind]}"><td>${e.kind}</td><td>${escapeHtml(e.key)}</td>` +
        `<td>${e.durability}</td><td>${escapeHtml(formatValue(e.before))}</td>` +
        `<td>${escapeHtml(formatValue(e.after))}</td></tr>`,
    )
    .join('\n');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Storage Diff Report</title>
<style>
  body { font-family: monospace; }
  table { border-collapse: collapse; width: 100%; }
  td, th { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
  .diff-added { background: #e6ffed; }
  .diff-removed { background: #ffeef0; }
  .diff-modified { background: #fff8c5; }
</style>
</head>
<body>
<h1>Storage Diff Report</h1>
<p>${result.addedCount} added, ${result.modifiedCount} modified, ${result.removedCount} removed</p>
<table>
<thead><tr><th>Change</th><th>Key</th><th>Durability</th><th>Before</th><th>After</th></tr></thead>
<tbody>
${result.hasChanges ? rows : '<tr><td colspan="5">No storage changes detected</td></tr>'}
</tbody>
</table>
</body>
</html>
`;
}
