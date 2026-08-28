import { describe, it, expect } from 'vitest';
import { formatCsv, csvEscape, stroopsToXlm, isValidTxType } from './csv-formatter.js';
import type { Transaction } from './tx-fetcher.js';

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    hash: 'ABCD1234HASH',
    timestamp: '2025-07-01T12:00:00.000Z',
    type: 'Wager Inflow',
    asset: 'XLM',
    amount: '10.0000000',
    fee: '0.0100000',
    sender: 'GAAAAAAA',
    recipient: 'GBBBBBBBB',
    ...overrides,
  };
}

describe('csvEscape', () => {
  it('returns plain strings unchanged', () => {
    expect(csvEscape('hello')).toBe('hello');
  });

  it('wraps strings containing commas in double-quotes', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
  });

  it('escapes double-quotes inside the field', () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps strings containing newlines', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });

  it('handles strings with both commas and quotes', () => {
    expect(csvEscape('a,"b"')).toBe('"a,""b"""');
  });

  it('returns empty string as-is', () => {
    expect(csvEscape('')).toBe('');
  });
});

describe('stroopsToXlm', () => {
  it('converts 10_000_000 stroops to 1.0000000', () => {
    expect(stroopsToXlm('10000000')).toBe('1.0000000');
  });

  it('converts 100_000 stroops to 0.0100000', () => {
    expect(stroopsToXlm('100000')).toBe('0.0100000');
  });

  it('converts 0 stroops to 0.0000000', () => {
    expect(stroopsToXlm('0')).toBe('0.0000000');
  });

  it('throws on non-numeric input', () => {
    expect(() => stroopsToXlm('abc')).toThrow('Invalid stroop value');
  });

  it('returns 0.0000000 for empty string (Number("") is 0)', () => {
    expect(stroopsToXlm('')).toBe('0.0000000');
  });
});

describe('isValidTxType', () => {
  it('accepts all valid types', () => {
    expect(isValidTxType('Wager Inflow')).toBe(true);
    expect(isValidTxType('Prize Payout')).toBe(true);
    expect(isValidTxType('Fee Revenue')).toBe(true);
    expect(isValidTxType('Staking Yield')).toBe(true);
  });

  it('rejects invalid types', () => {
    expect(isValidTxType('invalid')).toBe(false);
    expect(isValidTxType('')).toBe(false);
    expect(isValidTxType('wager inflow')).toBe(false); // case-sensitive
  });
});

describe('formatCsv', () => {
  it('produces correct headers', () => {
    const csv = formatCsv([]);
    const headerLine = csv.split('\n')[0];
    expect(headerLine).toBe(
      'Timestamp,TX Hash,Type,Asset,Amount,Fee,Sender,Recipient',
    );
  });

  it('handles a single transaction', () => {
    const csv = formatCsv([makeTx()]);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(2); // header + 1 data row
    expect(lines[1]).toContain('2025-07-01T12:00:00.000Z');
    expect(lines[1]).toContain('Wager Inflow');
    expect(lines[1]).toContain('XLM');
  });

  it('handles multiple transactions', () => {
    const txns = [
      makeTx({ hash: 'AAA', type: 'Wager Inflow' }),
      makeTx({ hash: 'BBB', type: 'Prize Payout' }),
      makeTx({ hash: 'CCC', type: 'Fee Revenue' }),
    ];
    const csv = formatCsv(txns);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(4); // header + 3 data rows
  });

  it('escapes fields with commas', () => {
    const tx = makeTx({ sender: 'GCOMMA,VAL' });
    const csv = formatCsv([tx]);
    expect(csv).toContain('"GCOMMA,VAL"');
  });

  it('escapes fields with double-quotes', () => {
    const tx = makeTx({ recipient: 'G"QUOTED' });
    const csv = formatCsv([tx]);
    expect(csv).toContain('"G""QUOTED"');
  });

  it('ends with a newline', () => {
    const csv = formatCsv([makeTx()]);
    expect(csv.endsWith('\n')).toBe(true);
  });

  it('empty array produces only header row with trailing newline', () => {
    const csv = formatCsv([]);
    expect(csv.trim()).toBe(
      'Timestamp,TX Hash,Type,Asset,Amount,Fee,Sender,Recipient',
    );
    expect(csv.endsWith('\n')).toBe(true);
  });

  it('format matches expected sample output', () => {
    const tx = makeTx({
      hash: 'ABCD1234HASH',
      timestamp: '2025-07-01T12:00:00.000Z',
      type: 'Wager Inflow',
      asset: 'XLM',
      amount: '10.0000000',
      fee: '0.0100000',
      sender: 'GAAAAAAA',
      recipient: 'GBBBBBBBB',
    });
    const csv = formatCsv([tx]);
    const dataLine = csv.split('\n')[1];
    expect(dataLine).toBe(
      '2025-07-01T12:00:00.000Z,ABCD1234HASH,Wager Inflow,XLM,10.0000000,0.0100000,GAAAAAAA,GBBBBBBBB',
    );
  });
});
