export interface AuditRecord {
  id: string | number;
  actor: string;
  action: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  [key: string]: unknown;
}

export interface ExportFilter {
  actor?: string;
  action?: string;
  /** Inclusive ISO-8601 lower bound */
  startDate?: string;
  /** Inclusive ISO-8601 upper bound */
  endDate?: string;
}

export type ExportFormat = 'csv' | 'json';

export interface EncryptedPayload {
  algorithm: 'aes-256-gcm';
  iv: string;
  authTag: string;
  salt: string;
  ciphertext: string;
}

export interface ExportManifest {
  format: ExportFormat;
  recordCount: number;
  checksumSha256: string;
  encrypted: boolean;
  generatedAt: string;
}
