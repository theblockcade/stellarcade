import { DecodedStateEntry, decodeStateEntry, DurabilityType, StateEntryRaw } from './decoders';

export interface DumpOptions {
  contractId: string;
  rpcUrl?: string;
  durability?: 'all' | DurabilityType;
  format?: 'json' | 'csv';
  entriesFile?: string;
  limit?: number;
}

export function filterEntriesByDurability(
  entries: DecodedStateEntry[],
  durabilityFilter?: 'all' | DurabilityType
): DecodedStateEntry[] {
  if (!durabilityFilter || durabilityFilter === 'all') {
    return entries;
  }
  return entries.filter((e) => e.durability === durabilityFilter);
}

export function exportToJson(entries: DecodedStateEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function escapeCsvField(field: any): string {
  if (field === null || field === undefined) return '""';
  const str = typeof field === 'object' ? JSON.stringify(field) : String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv(entries: DecodedStateEntry[]): string {
  const headers = ['key', 'key_type', 'durability', 'value_type', 'value', 'last_modified_ledger'];
  const rows: string[] = [headers.join(',')];

  for (const entry of entries) {
    const row = [
      escapeCsvField(entry.key),
      escapeCsvField(entry.keyType),
      escapeCsvField(entry.durability),
      escapeCsvField(entry.valueType),
      escapeCsvField(entry.value),
      escapeCsvField(entry.lastModifiedLedger ?? '')
    ];
    rows.push(row.join(','));
  }

  return rows.join('\n');
}

export function processRawEntries(
  rawEntries: StateEntryRaw[],
  durabilityFilter: 'all' | DurabilityType = 'all'
): DecodedStateEntry[] {
  const decoded = rawEntries.map(decodeStateEntry);
  return filterEntriesByDurability(decoded, durabilityFilter);
}
