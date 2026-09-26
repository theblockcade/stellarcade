import * as crypto from 'crypto';
import type {
  AuditRecord,
  EncryptedPayload,
  ExportFilter,
  ExportFormat,
  ExportManifest,
} from '../types';

const SCRYPT_KEYLEN = 32;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

/** Filters records by actor, action, and inclusive date range without loading everything at once. */
export function* filterRecords(
  records: Iterable<AuditRecord>,
  filter: ExportFilter = {}
): Generator<AuditRecord> {
  const start = filter.startDate ? new Date(filter.startDate).getTime() : -Infinity;
  const end = filter.endDate ? new Date(filter.endDate).getTime() : Infinity;

  for (const record of records) {
    if (filter.actor && record.actor !== filter.actor) continue;
    if (filter.action && record.action !== filter.action) continue;
    const ts = new Date(record.timestamp).getTime();
    if (ts < start || ts > end) continue;
    yield record;
  }
}

function sanitizeHeader(key: string): string {
  return key.replace(/[^a-zA-Z0-9_]/g, '_');
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Builds a CSV document (header + rows) from an ordered list of audit records. */
export function toCsv(records: AuditRecord[]): string {
  if (records.length === 0) return '';
  const columns = Array.from(
    records.reduce((set, r) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );

  const header = columns.map(sanitizeHeader).join(',');
  const rows = records.map((record) => columns.map((col) => csvEscape(record[col])).join(','));
  return [header, ...rows].join('\n');
}

/** Builds a JSON document from an ordered list of audit records. */
export function toJson(records: AuditRecord[]): string {
  return JSON.stringify(records, null, 2);
}

export function formatRecords(records: AuditRecord[], format: ExportFormat): string {
  return format === 'csv' ? toCsv(records) : toJson(records);
}

/** SHA-256 checksum of a payload, used as an integrity manifest entry. */
export function computeChecksum(payload: string | Buffer): string {
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/** Encrypts a payload with AES-256-GCM, deriving the key from a password via scrypt. */
export function encryptPayload(payload: string, password: string): EncryptedPayload {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(payload, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    algorithm: 'aes-256-gcm',
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex'),
    ciphertext: ciphertext.toString('hex'),
  };
}

/** Decrypts a payload produced by {@link encryptPayload} given the same password. */
export function decryptPayload(encrypted: EncryptedPayload, password: string): string {
  const salt = Buffer.from(encrypted.salt, 'hex');
  const key = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  const iv = Buffer.from(encrypted.iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, 'hex')),
    decipher.final(),
  ]);
  return plaintext.toString('utf8');
}

export interface ExportResult {
  content: string | EncryptedPayload;
  manifest: ExportManifest;
}

/** Full export pipeline: filter -> format -> checksum -> optional encryption. */
export function exportAuditLog(
  records: Iterable<AuditRecord>,
  options: { format: ExportFormat; filter?: ExportFilter; encryptPassword?: string }
): ExportResult {
  const filtered = Array.from(filterRecords(records, options.filter));
  const formatted = formatRecords(filtered, options.format);
  const checksumSha256 = computeChecksum(formatted);

  const manifest: ExportManifest = {
    format: options.format,
    recordCount: filtered.length,
    checksumSha256,
    encrypted: Boolean(options.encryptPassword),
    generatedAt: new Date().toISOString(),
  };

  if (options.encryptPassword) {
    return { content: encryptPayload(formatted, options.encryptPassword), manifest };
  }

  return { content: formatted, manifest };
}
