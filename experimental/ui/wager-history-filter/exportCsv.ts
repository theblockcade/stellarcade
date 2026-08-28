import type { WagerRecord } from './types';

const CSV_HEADERS = ['Timestamp', 'Game', 'Wager Amount', 'Net Payout', 'Outcome', 'TX Hash'];

/**
 * Escapes a single CSV field per RFC 4180: wraps in double quotes and
 * doubles any embedded quote whenever the value contains a comma, quote,
 * or newline (values that would otherwise break column alignment).
 */
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function recordToRow(record: WagerRecord): string {
  const fields = [
    record.timestamp,
    record.gameName,
    record.wagerAmount.toString(),
    record.netPayout.toString(),
    record.outcome,
    record.txHash,
  ];
  return fields.map(escapeCsvField).join(',');
}

/** Builds the full CSV string (header + one row per record). */
export function buildCsv(records: WagerRecord[]): string {
  const lines = [CSV_HEADERS.join(','), ...records.map(recordToRow)];
  return lines.join('\r\n');
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Generates a downloadable `wager-history-YYYY-MM-DD.csv` from the given
 * records and triggers a browser download. No-ops outside a browser
 * environment (e.g. during SSR).
 */
export function exportToCsv(records: WagerRecord[]): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    return;
  }
  const csv = buildCsv(records);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `wager-history-${todayIsoDate()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
