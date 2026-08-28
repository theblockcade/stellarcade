import { describe, it, expect } from 'vitest';
import { diffStorageEntries, StorageEntryRaw } from './diff-engine';
import { formatDiffAnsi, formatDiffHtml, formatDiffMarkdown } from './formatter';

const before: StorageEntryRaw[] = [
  { key: { symbol: 'Removed' }, value: { u32: 1 }, durability: 'instance' },
  { key: { symbol: 'Changed' }, value: { u32: 10 }, durability: 'instance' },
];
const after: StorageEntryRaw[] = [
  { key: { symbol: 'Changed' }, value: { u32: 20 }, durability: 'instance' },
  { key: { symbol: 'Added' }, value: { u32: 5 }, durability: 'instance' },
];

describe('formatDiffAnsi', () => {
  it('reports "No storage changes detected" for identical snapshots', () => {
    const result = diffStorageEntries(before, before.map((e) => ({ ...e })));
    expect(formatDiffAnsi(result)).toContain('No storage changes detected');
  });

  it('includes every changed key in the ansi output', () => {
    const result = diffStorageEntries(before, after);
    const output = formatDiffAnsi(result);
    expect(output).toContain('Added');
    expect(output).toContain('Changed');
    expect(output).toContain('Removed');
  });
});

describe('formatDiffMarkdown', () => {
  it('reports no changes in plain text', () => {
    const result = diffStorageEntries(before, before.map((e) => ({ ...e })));
    expect(formatDiffMarkdown(result)).toBe('No storage changes detected.');
  });

  it('renders a markdown table with a row per change', () => {
    const result = diffStorageEntries(before, after);
    const md = formatDiffMarkdown(result);
    expect(md).toContain('| Change | Key | Durability | Before | After |');
    expect(md).toContain('`Added`');
    expect(md).toContain('`Changed`');
    expect(md).toContain('`Removed`');
  });
});

describe('formatDiffHtml', () => {
  it('renders a self-contained HTML document', () => {
    const result = diffStorageEntries(before, after);
    const html = formatDiffHtml(result);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Added');
    expect(html).toContain('diff-modified');
  });

  it('escapes HTML-special characters in key/value content', () => {
    const dangerous: StorageEntryRaw[] = [
      { key: { symbol: '<script>' }, value: { str: '"><img src=x>' }, durability: 'instance' },
    ];
    const result = diffStorageEntries([], dangerous);
    const html = formatDiffHtml(result);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('shows the no-changes row for identical snapshots', () => {
    const result = diffStorageEntries(before, before.map((e) => ({ ...e })));
    const html = formatDiffHtml(result);
    expect(html).toContain('No storage changes detected');
  });
});
