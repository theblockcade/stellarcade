import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scaffoldFixture, ScaffoldOverwriteError } from './scaffolder';

describe('scaffoldFixture', () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'mock-fixture-scaffold-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes test.rs to the destination directory', () => {
    const result = scaffoldFixture({
      contract: 'badge-evolution',
      template: 'single-player',
      dest: dir,
      force: false,
    });

    expect(result.filePath).toBe(join(dir, 'test.rs'));
    expect(existsSync(result.filePath)).toBe(true);
    expect(readFileSync(result.filePath, 'utf8')).toBe(result.contents);
  });

  it('creates the destination directory if it does not exist', () => {
    const nested = join(dir, 'nested', 'src');
    const result = scaffoldFixture({
      contract: 'trivia-duel',
      template: 'multi-player',
      dest: nested,
      force: false,
    });
    expect(existsSync(result.filePath)).toBe(true);
  });

  it('refuses to overwrite an existing test.rs without --force', () => {
    writeFileSync(join(dir, 'test.rs'), 'existing content', 'utf8');

    expect(() =>
      scaffoldFixture({ contract: 'badge-evolution', template: 'single-player', dest: dir, force: false }),
    ).toThrow(ScaffoldOverwriteError);

    // File must be untouched.
    expect(readFileSync(join(dir, 'test.rs'), 'utf8')).toBe('existing content');
  });

  it('overwrites an existing test.rs when --force is set', () => {
    writeFileSync(join(dir, 'test.rs'), 'existing content', 'utf8');

    const result = scaffoldFixture({
      contract: 'badge-evolution',
      template: 'single-player',
      dest: dir,
      force: true,
    });

    expect(readFileSync(join(dir, 'test.rs'), 'utf8')).toBe(result.contents);
    expect(readFileSync(join(dir, 'test.rs'), 'utf8')).not.toBe('existing content');
  });

  it('includes the filePath in the ScaffoldOverwriteError message', () => {
    writeFileSync(join(dir, 'test.rs'), '', 'utf8');
    try {
      scaffoldFixture({ contract: 'x', template: 'single-player', dest: dir, force: false });
      throw new Error('expected scaffoldFixture to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ScaffoldOverwriteError);
      expect((err as ScaffoldOverwriteError).filePath).toBe(join(dir, 'test.rs'));
      expect((err as Error).message).toContain('--force');
    }
  });
});
