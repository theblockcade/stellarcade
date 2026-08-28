import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateFixture } from './templates';
import type { FixtureTemplate, ScaffoldOptions } from './types';

export const VALID_TEMPLATES: FixtureTemplate[] = ['single-player', 'multi-player', 'staking'];

export class InvalidTemplateError extends Error {
  constructor(public readonly value: string) {
    super(`Invalid --template "${value}". Expected one of: ${VALID_TEMPLATES.join(', ')}`);
    this.name = 'InvalidTemplateError';
  }
}

/** Validate and narrow a raw `--template` CLI value. */
export function parseTemplate(value: string): FixtureTemplate {
  if (!VALID_TEMPLATES.includes(value as FixtureTemplate)) {
    throw new InvalidTemplateError(value);
  }
  return value as FixtureTemplate;
}

interface RawCliOptions {
  contract: string;
  template?: string;
  out?: string;
  force?: boolean;
}

/** Resolve raw commander option values into a validated ScaffoldOptions,
 * applying the same defaults `index.ts` declares on the CLI flags. */
export function resolveScaffoldOptions(raw: RawCliOptions): ScaffoldOptions {
  return {
    contract: raw.contract,
    template: parseTemplate(raw.template ?? 'single-player'),
    dest: raw.out ?? './src',
    force: Boolean(raw.force ?? false),
  };
}

export class ScaffoldOverwriteError extends Error {
  constructor(public readonly filePath: string) {
    super(`Refusing to overwrite existing file: ${filePath} (pass --force to overwrite)`);
    this.name = 'ScaffoldOverwriteError';
  }
}

export interface ScaffoldResult {
  filePath: string;
  contents: string;
}

/**
 * Generate a test.rs fixture and write it to `<dest>/test.rs`.
 *
 * @throws ScaffoldOverwriteError if the target file already exists and
 * `force` is not set.
 */
export function scaffoldFixture(options: ScaffoldOptions): ScaffoldResult {
  const filePath = join(options.dest, 'test.rs');

  if (existsSync(filePath) && !options.force) {
    throw new ScaffoldOverwriteError(filePath);
  }

  const contents = generateFixture(options.contract, options.template);

  mkdirSync(options.dest, { recursive: true });
  writeFileSync(filePath, contents, 'utf8');

  return { filePath, contents };
}
