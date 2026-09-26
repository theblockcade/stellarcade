import { describe, it, expect } from 'vitest';
import {
  toCsv,
  toJson,
  computeChecksum,
  encryptPayload,
  decryptPayload,
  exportAuditLog,
  filterRecords,
} from './exporter';
import type { AuditRecord } from '../types';

const sample: AuditRecord[] = [
  { id: 1, actor: 'alice', action: 'login', timestamp: '2024-01-01T00:00:00.000Z' },
  { id: 2, actor: 'bob', action: 'bet_placed', timestamp: '2024-01-02T00:00:00.000Z' },
  { id: 3, actor: 'alice', action: 'bet_placed', timestamp: '2024-01-03T00:00:00.000Z' },
];

describe('CSV generation', () => {
  it('generates accurate headers and rows', () => {
    const csv = toCsv(sample);
    const lines = csv.split('\n');
    expect(lines[0].split(',').sort()).toEqual(['action', 'actor', 'id', 'timestamp'].sort());
    expect(lines).toHaveLength(4);
    expect(csv).toContain('alice');
    expect(csv).toContain('bet_placed');
  });

  it('escapes commas, quotes, and newlines', () => {
    const csv = toCsv([{ id: 1, actor: 'a,b', action: 'note "x"', timestamp: 't\nline' }]);
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"note ""x"""');
    expect(csv).toContain('"t\nline"');
  });

  it('returns an empty string for no records', () => {
    expect(toCsv([])).toBe('');
  });
});

describe('JSON generation', () => {
  it('round-trips records', () => {
    const json = toJson(sample);
    expect(JSON.parse(json)).toEqual(sample);
  });
});

describe('filtering', () => {
  it('filters by actor, action, and date range', () => {
    const filtered = Array.from(filterRecords(sample, { actor: 'alice' }));
    expect(filtered).toHaveLength(2);

    const byAction = Array.from(filterRecords(sample, { action: 'bet_placed' }));
    expect(byAction).toHaveLength(2);

    const byDate = Array.from(
      filterRecords(sample, { startDate: '2024-01-02T00:00:00.000Z', endDate: '2024-01-02T23:59:59.000Z' })
    );
    expect(byDate).toHaveLength(1);
    expect(byDate[0].id).toBe(2);
  });
});

describe('AES-256-GCM round-trip', () => {
  it('encrypts and decrypts back to the original payload', () => {
    const original = toJson(sample);
    const encrypted = encryptPayload(original, 'correct-horse-battery-staple');
    expect(encrypted.algorithm).toBe('aes-256-gcm');
    const decrypted = decryptPayload(encrypted, 'correct-horse-battery-staple');
    expect(decrypted).toBe(original);
  });

  it('fails to decrypt with the wrong password', () => {
    const original = toJson(sample);
    const encrypted = encryptPayload(original, 'right-password');
    expect(() => decryptPayload(encrypted, 'wrong-password')).toThrow();
  });
});

describe('checksum manifest', () => {
  it('produces a matching SHA-256 checksum for the exported payload', () => {
    const result = exportAuditLog(sample, { format: 'json' });
    expect(result.manifest.checksumSha256).toBe(computeChecksum(result.content as string));
    expect(result.manifest.recordCount).toBe(sample.length);
    expect(result.manifest.encrypted).toBe(false);
  });

  it('marks the manifest as encrypted when a password is supplied', () => {
    const result = exportAuditLog(sample, { format: 'csv', encryptPassword: 'secret' });
    expect(result.manifest.encrypted).toBe(true);
    expect(typeof result.content).toBe('object');
  });
});
