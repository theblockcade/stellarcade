import { describe, it, expect } from 'vitest';
import { parseTemplate, resolveScaffoldOptions, InvalidTemplateError, VALID_TEMPLATES } from './scaffolder';

describe('parseTemplate', () => {
  it('accepts each valid template value', () => {
    for (const value of VALID_TEMPLATES) {
      expect(parseTemplate(value)).toBe(value);
    }
  });

  it('throws InvalidTemplateError for an unrecognized value', () => {
    expect(() => parseTemplate('not-a-real-template')).toThrow(InvalidTemplateError);
  });

  it('includes the offending value and valid options in the error message', () => {
    try {
      parseTemplate('bogus');
      throw new Error('expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTemplateError);
      expect((err as Error).message).toContain('bogus');
      expect((err as Error).message).toContain('single-player');
    }
  });
});

describe('resolveScaffoldOptions — defaults', () => {
  it('defaults --template to single-player when omitted', () => {
    const options = resolveScaffoldOptions({ contract: 'badge-evolution' });
    expect(options.template).toBe('single-player');
  });

  it('defaults --out to ./src when omitted', () => {
    const options = resolveScaffoldOptions({ contract: 'badge-evolution' });
    expect(options.dest).toBe('./src');
  });

  it('defaults --force to false when omitted', () => {
    const options = resolveScaffoldOptions({ contract: 'badge-evolution' });
    expect(options.force).toBe(false);
  });

  it('passes through explicitly provided flags over the defaults', () => {
    const options = resolveScaffoldOptions({
      contract: 'trivia-duel',
      template: 'multi-player',
      out: '../contracts/trivia-duel/src',
      force: true,
    });
    expect(options).toEqual({
      contract: 'trivia-duel',
      template: 'multi-player',
      dest: '../contracts/trivia-duel/src',
      force: true,
    });
  });

  it('propagates InvalidTemplateError for a bad --template value', () => {
    expect(() => resolveScaffoldOptions({ contract: 'x', template: 'nope' })).toThrow(
      InvalidTemplateError,
    );
  });
});
