import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SymbolComparator } from './comparator';
import type { ErrorSymbol, SdkMapping } from './types';

describe('SymbolComparator', () => {
  const makeContractSymbol = (overrides: Partial<ErrorSymbol> = {}): ErrorSymbol => ({
    symbol: 'TOKEN::NotAuthorized',
    source: '/contracts/token.rs',
    lineNumber: 10,
    type: 'contract_error',
    ...overrides,
  });

  const makeSdkMapping = (overrides: Partial<SdkMapping> = {}): SdkMapping => ({
    symbol: 'TOKEN::NotAuthorized',
    message: 'Not authorized',
    source: '/sdk/errors.ts',
    lineNumber: 5,
    ...overrides,
  });

  describe('compare', () => {
    it('returns no discrepancies when all symbols match', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::X' }),
        makeContractSymbol({ symbol: 'B::Y' }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'A::X', message: 'X error' }),
        makeSdkMapping({ symbol: 'B::Y', message: 'Y error' }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      expect(comparator.compare()).toHaveLength(0);
    });

    it('finds all types of discrepancies', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::X' }),
        makeContractSymbol({ symbol: 'B::Y' }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'A::X', message: 'X error' }),
        makeSdkMapping({ symbol: 'C::Z', message: 'Z error' }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      const disc = comparator.compare();
      expect(disc).toHaveLength(2);
      expect(disc.some(d => d.symbol === 'B::Y' && d.status === 'missing_in_sdk')).toBe(true);
      expect(disc.some(d => d.symbol === 'C::Z' && d.status === 'missing_in_contract')).toBe(true);
    });
  });

  describe('findMissingInSdk', () => {
    it('returns contract symbols not present in SDK', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::X' }),
        makeContractSymbol({ symbol: 'B::Y' }),
        makeContractSymbol({ symbol: 'C::Z' }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'A::X', message: 'X error' }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      const missing = comparator.findMissingInSdk();
      expect(missing).toHaveLength(2);
      expect(missing.map(m => m.symbol).sort()).toEqual(['B::Y', 'C::Z']);
      expect(missing[0].status).toBe('missing_in_sdk');
      expect(missing[0].contractSource).toBe('/contracts/token.rs');
    });

    it('returns empty when all contract symbols are in SDK', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::X' }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'A::X', message: 'msg' }),
        makeSdkMapping({ symbol: 'B::Y', message: 'extra' }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      expect(comparator.findMissingInSdk()).toHaveLength(0);
    });
  });

  describe('findMissingInContract', () => {
    it('returns SDK symbols not present in contracts', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::X' }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'A::X', message: 'X error' }),
        makeSdkMapping({ symbol: 'B::Y', message: 'Y error' }),
        makeSdkMapping({ symbol: 'C::Z', message: 'Z error' }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      const missing = comparator.findMissingInContract();
      expect(missing).toHaveLength(2);
      expect(missing.map(m => m.symbol).sort()).toEqual(['B::Y', 'C::Z']);
      expect(missing[0].status).toBe('missing_in_contract');
      expect(missing[0].sdkSource).toBe('/sdk/errors.ts');
    });

    it('returns empty when all SDK symbols are in contracts', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::X' }),
        makeContractSymbol({ symbol: 'B::Y' }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'A::X', message: 'msg' }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      expect(comparator.findMissingInContract()).toHaveLength(0);
    });
  });

  describe('findMessageMismatches', () => {
    it('detects message mismatches for enum_variant type symbols', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'TokenError::InsufficientBalance', type: 'enum_variant' }),
      ];
      const sdk = [
        makeSdkMapping({
          symbol: 'TokenError::InsufficientBalance',
          message: 'Insufficient funds',
        }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      const mismatches = comparator.findMessageMismatches();
      expect(mismatches).toHaveLength(1);
      expect(mismatches[0].status).toBe('message_mismatch');
      expect(mismatches[0].sdkMessage).toBe('Insufficient funds');
    });

    it('does not flag matching messages', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'X::Y', type: 'enum_variant' }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'X::Y', message: 'Y' }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      expect(comparator.findMessageMismatches()).toHaveLength(0);
    });

    it('skips message comparison for non-enum_variant types', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::B', type: 'symbol' }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'A::B', message: 'anything' }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      expect(comparator.findMessageMismatches()).toHaveLength(0);
    });
  });

  describe('getSummary', () => {
    it('counts matched and mismatched symbols correctly', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::X', type: 'enum_variant' }),
        makeContractSymbol({ symbol: 'B::Y' }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'A::X', message: 'wrong' }),
        makeSdkMapping({ symbol: 'C::Z', message: 'extra' }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      const summary = comparator.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.matched).toBe(1);
      expect(summary.mismatched).toBeGreaterThanOrEqual(2);
    });

    it('returns all zeros for empty inputs', () => {
      const comparator = new SymbolComparator([], []);
      const summary = comparator.getSummary();
      expect(summary.total).toBe(0);
      expect(summary.matched).toBe(0);
      expect(summary.mismatched).toBe(0);
    });
  });

  describe('exportMarkdown', () => {
    it('generates a markdown table with all symbols', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::X', source: '/contracts/a.rs', lineNumber: 10 }),
      ];
      const sdk = [
        makeSdkMapping({ symbol: 'A::X', source: '/sdk/errors.ts', lineNumber: 5 }),
      ];
      const comparator = new SymbolComparator(contracts, sdk);
      const md = comparator.exportMarkdown();
      expect(md).toContain('# Error Symbol Validation Report');
      expect(md).toContain('| Symbol | Status | Contract Source | SDK Source |');
      expect(md).toContain('| A::X | matched | /contracts/a.rs:10 | /sdk/errors.ts:5 |');
      expect(md).toContain('**Total:** 1 symbols');
    });

    it('marks missing symbols correctly', () => {
      const contracts = [
        makeContractSymbol({ symbol: 'A::X', source: '/a.rs', lineNumber: 1 }),
      ];
      const comparator = new SymbolComparator(contracts, []);
      const md = comparator.exportMarkdown();
      expect(md).toContain('| A::X | missing_in_sdk | /a.rs:1 | - |');
    });

    it('marks SDK-only symbols correctly', () => {
      const sdk = [
        makeSdkMapping({ symbol: 'B::Y', source: '/sdk.ts', lineNumber: 3 }),
      ];
      const comparator = new SymbolComparator([], sdk);
      const md = comparator.exportMarkdown();
      expect(md).toContain('| B::Y | missing_in_contract | - | /sdk.ts:3 |');
    });

    it('handles empty inputs', () => {
      const comparator = new SymbolComparator([], []);
      const md = comparator.exportMarkdown();
      expect(md).toContain('# Error Symbol Validation Report');
      expect(md).toContain('**Total:** 0 symbols');
    });
  });
});
