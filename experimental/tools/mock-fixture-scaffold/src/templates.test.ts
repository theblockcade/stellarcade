import { describe, it, expect } from 'vitest';
import { generateFixture, toPascalCase } from './templates';
import type { FixtureTemplate } from './types';

/**
 * Minimal structural validator for generated Rust — this workspace has no
 * Rust toolchain available at the TS test-run step, so this checks the
 * properties a syntax error would violate (balanced delimiters, no stray
 * template placeholders) rather than a full parse.
 */
function assertPlausibleRust(source: string): void {
  const opens = (source.match(/[{([]/g) ?? []).length;
  const closes = (source.match(/[})\]]/g) ?? []).length;
  expect(opens).toBe(closes);
  expect(source).not.toMatch(/\$\{/); // no unsubstituted template literals
  expect(source).not.toMatch(/undefined/);
  expect(source.trim().length).toBeGreaterThan(0);
}

describe('toPascalCase', () => {
  it('converts a kebab-case name to PascalCase', () => {
    expect(toPascalCase('badge-evolution')).toBe('BadgeEvolution');
  });

  it('handles a single-word name', () => {
    expect(toPascalCase('coinflip')).toBe('Coinflip');
  });

  it('handles underscores as well as hyphens', () => {
    expect(toPascalCase('trivia_duel')).toBe('TriviaDuel');
  });
});

describe.each<FixtureTemplate>(['single-player', 'multi-player', 'staking'])(
  'generateFixture — %s template',
  (template) => {
    it('produces structurally plausible Rust', () => {
      const source = generateFixture('badge-evolution', template);
      assertPlausibleRust(source);
    });

    it('includes the cfg(test) guard and necessary imports', () => {
      const source = generateFixture('badge-evolution', template);
      expect(source).toContain('#![cfg(test)]');
      expect(source).toContain('use soroban_sdk::');
      expect(source).toContain('use super::*;');
    });

    it('references the PascalCase contract and client types', () => {
      const source = generateFixture('badge-evolution', template);
      expect(source).toContain('BadgeEvolutionContract');
      expect(source).toContain('BadgeEvolutionContractClient');
    });

    it('mocks all auths so generated tests need no real signatures', () => {
      const source = generateFixture('badge-evolution', template);
      expect(source).toContain('env.mock_all_auths()');
    });

    it('mints a token via the Stellar asset contract admin client', () => {
      const source = generateFixture('badge-evolution', template);
      expect(source).toContain('register_stellar_asset_contract_v2');
      expect(source).toContain('.mint(');
    });

    it('includes at least one #[test] function', () => {
      const source = generateFixture('badge-evolution', template);
      expect(source).toMatch(/#\[test\]/);
    });
  },
);

describe('generateFixture — template-specific shape', () => {
  it('single-player scaffolds exactly one player', () => {
    const source = generateFixture('coinflip', 'single-player');
    expect(source).toContain('player: Address');
    expect(source).not.toContain('players: [Address; 3]');
  });

  it('multi-player scaffolds three players', () => {
    const source = generateFixture('trivia-duel', 'multi-player');
    expect(source).toContain('players: [Address; 3]');
  });

  it('staking scaffolds a staker and an oracle address', () => {
    const source = generateFixture('vesting', 'staking');
    expect(source).toContain('staker: Address');
    expect(source).toContain('oracle: Address');
  });
});

describe('generateFixture — snake_case contract name in test function', () => {
  it('converts a hyphenated contract name into a valid snake_case test fn name', () => {
    const source = generateFixture('badge-evolution', 'single-player');
    expect(source).toMatch(/fn test_badge_evolution_/);
    expect(source).not.toContain('fn test_badge-evolution_');
  });
});
