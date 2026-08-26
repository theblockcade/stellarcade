import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { SymbolExtractor } from './extractor';

vi.mock('fs');

describe('SymbolExtractor', () => {
  let extractor: SymbolExtractor;

  beforeEach(() => {
    extractor = new SymbolExtractor('/mock/contracts');
  });

  describe('extractSymbolNewPatterns', () => {
    it('extracts Symbol::new patterns from Rust code', () => {
      const content = `
use soroban_sdk::{symbol, Env};

pub fn do_something(env: &Env) {
    let sym = Symbol::new(&env, "TRANSFER");
    let err = Symbol::new(&env, "INSUFFICIENT_BALANCE");
    env.storage().persistent().set(&sym, &42i32);
}
`;
      const results = extractor.extractSymbolNewPatterns(content, '/mock/contracts/token.rs');
      expect(results).toHaveLength(2);
      expect(results[0].symbol).toBe('TRANSFER');
      expect(results[0].type).toBe('symbol');
      expect(results[0].source).toBe('/mock/contracts/token.rs');
      expect(results[0].lineNumber).toBe(5);
      expect(results[1].symbol).toBe('INSUFFICIENT_BALANCE');
    });

    it('handles Symbol::new with varied spacing', () => {
      const content = `
Symbol::new(&env,"NO_SPACE")
Symbol::new(& env , "SPACED")
Symbol::new(&env,   "TRIMMED"  )
`;
      const results = extractor.extractSymbolNewPatterns(content, 'test.rs');
      expect(results).toHaveLength(3);
      expect(results[0].symbol).toBe('NO_SPACE');
      expect(results[1].symbol).toBe('SPACED');
      expect(results[2].symbol).toBe('TRIMMED');
    });

    it('returns empty array when no patterns found', () => {
      const content = `
use soroban_sdk::Env;

pub fn hello(env: &Env) {
    let x = 42;
}
`;
      const results = extractor.extractSymbolNewPatterns(content, 'test.rs');
      expect(results).toHaveLength(0);
    });

    it('does not match Symbol::new without the string argument', () => {
      const content = `
Symbol::new(&env, var_name)
Symbol::new(&env, get_symbol())
`;
      const results = extractor.extractSymbolNewPatterns(content, 'test.rs');
      expect(results).toHaveLength(0);
    });
  });

  describe('extractContractErrors', () => {
    it('extracts #[contracterror] enum variants', () => {
      const content = `
use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TokenError {
    NotAuthorized = 1,
    Overflow = 2,
    InsufficientBalance = 3,
}
`;
      const results = extractor.extractContractErrors(content, '/mock/contracts/token_errors.rs');
      expect(results).toHaveLength(3);
      expect(results[0].symbol).toBe('TokenError::NotAuthorized');
      expect(results[0].type).toBe('contract_error');
      expect(results[0].source).toBe('/mock/contracts/token_errors.rs');
      expect(results[1].symbol).toBe('TokenError::Overflow');
      expect(results[2].symbol).toBe('TokenError::InsufficientBalance');
    });

    it('handles multiline enum definitions', () => {
      const content = `
#[contracterror]
pub enum AuctionError {
    BidTooLow = 1,
    AuctionNotActive = 2,
    AlreadyFinalized = 3,
    Unauthorized = 4,
}
`;
      const results = extractor.extractContractErrors(content, 'auction.rs');
      expect(results).toHaveLength(4);
      expect(results.map(r => r.symbol)).toEqual([
        'AuctionError::BidTooLow',
        'AuctionError::AuctionNotActive',
        'AuctionError::AlreadyFinalized',
        'AuctionError::Unauthorized',
      ]);
    });

    it('handles multiple contracterror enums in same file', () => {
      const content = `
#[contracterror]
pub enum ErrorA {
    First = 1,
    Second = 2,
}

#[contracterror]
pub enum ErrorB {
    Alpha = 1,
    Beta = 2,
}
`;
      const results = extractor.extractContractErrors(content, 'multi.rs');
      expect(results).toHaveLength(4);
      expect(results[0].symbol).toBe('ErrorA::First');
      expect(results[3].symbol).toBe('ErrorB::Beta');
    });

    it('returns empty when no contracterror enums present', () => {
      const content = `
pub enum RegularEnum {
    Variant1,
    Variant2,
}
`;
      const results = extractor.extractContractErrors(content, 'test.rs');
      expect(results).toHaveLength(0);
    });
  });

  describe('extractPanicWithError', () => {
    it('extracts panic_with_error! macro patterns', () => {
      const content = `
use soroban_sdk::{contracterror, panic_with_error};

#[contracterror]
pub enum Error {
    Failed = 1,
}

fn process(env: &Env) {
    panic_with_error!(&env, Error::Failed);
}
`;
      const results = extractor.extractPanicWithError(content, 'test.rs');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].type).toBe('enum_variant');
    });

    it('extracts panic_with_error with string error', () => {
      const content = `
fn fail(env: &Env) {
    panic_with_error!(&env, "Something went wrong");
}
`;
      const results = extractor.extractPanicWithError(content, 'test.rs');
      expect(results).toHaveLength(1);
      expect(results[0].symbol).toBe('Something went wrong');
      expect(results[0].type).toBe('enum_variant');
    });
  });

  describe('getLineNumber', () => {
    it('returns 1 for index 0', () => {
      expect(extractor.getLineNumber('abc', 0)).toBe(1);
    });

    it('counts newlines correctly', () => {
      const content = 'line1\nline2\nline3\n';
      expect(extractor.getLineNumber(content, 0)).toBe(1);
      expect(extractor.getLineNumber(content, 4)).toBe(1);
      expect(extractor.getLineNumber(content, 6)).toBe(2);
      expect(extractor.getLineNumber(content, 10)).toBe(2);
      expect(extractor.getLineNumber(content, 12)).toBe(3);
    });

    it('returns correct line for multiline content', () => {
      const content = `first line
second line
third line`;
      expect(extractor.getLineNumber(content, content.indexOf('third'))).toBe(3);
    });
  });

  describe('extractFromFile', () => {
    it('combines all extraction methods', () => {
      const content = `
use soroban_sdk::{symbol, contracterror, Env};

#[contracterror]
pub enum Errors {
    BadInput = 1,
    TooLate = 2,
}

pub fn transfer(env: &Env) {
    let sym = Symbol::new(&env, "TRANSFER");
    panic_with_error!(&env, Errors::BadInput);
}
`;
      vi.mocked(fs.readFileSync).mockReturnValue(content as any);
      const results = extractor.extractFromFile('/mock/file.rs');
      expect(results.length).toBeGreaterThanOrEqual(3);
      const symbols = results.map(r => r.symbol);
      expect(symbols).toContain('TRANSFER');
      expect(symbols).toContain('Errors::BadInput');
      expect(symbols).toContain('Errors::TooLate');
    });
  });

  describe('extractAll', () => {
    it('scans all .rs files recursively', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockReturnValue([
        { name: 'token.rs', isFile: () => true, parentPath: '/mock/contracts', path: '/mock/contracts' },
        { name: 'lib.rs', isFile: () => true, parentPath: '/mock/contracts', path: '/mock/contracts' },
        { name: 'readme.md', isFile: () => true, parentPath: '/mock/contracts', path: '/mock/contracts' },
      ] as any);
      vi.mocked(fs.readFileSync).mockImplementation((p: any) => {
        if (p === '/mock/contracts/token.rs') {
          return 'Symbol::new(&env, "TRANSFER")';
        }
        return 'fn hello() {}';
      });
      const results = extractor.extractAll();
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(r => r.symbol === 'TRANSFER')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles empty files gracefully', () => {
      expect(extractor.extractSymbolNewPatterns('', 'empty.rs')).toHaveLength(0);
      expect(extractor.extractContractErrors('', 'empty.rs')).toHaveLength(0);
      expect(extractor.extractPanicWithError('', 'empty.rs')).toHaveLength(0);
    });

    it('handles files with no error patterns', () => {
      const content = `
fn add(a: i32, b: i32) -> i32 {
    a + b
}

struct Point {
    x: f64,
    y: f64,
}
`;
      expect(extractor.extractSymbolNewPatterns(content, 'utils.rs')).toHaveLength(0);
      expect(extractor.extractContractErrors(content, 'utils.rs')).toHaveLength(0);
      expect(extractor.extractPanicWithError(content, 'utils.rs')).toHaveLength(0);
    });

    it('handles malformed Symbol::new patterns', () => {
      const content = `
Symbol::new()  // missing args
Symbol::new(&env)  // missing string
Symbol::new(&env, )  // missing second arg
`;
      const results = extractor.extractSymbolNewPatterns(content, 'test.rs');
      expect(results).toHaveLength(0);
    });
  });
});
