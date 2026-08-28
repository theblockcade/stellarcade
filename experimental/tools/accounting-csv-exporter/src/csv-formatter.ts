import type { Transaction, TxType } from './tx-fetcher.js';

/** CSV column headers */
const HEADERS = [
  'Timestamp',
  'TX Hash',
  'Type',
  'Asset',
  'Amount',
  'Fee',
  'Sender',
  'Recipient',
] as const;

/**
 * Format an array of Transaction objects as a CSV string.
 *
 * - Dates are ISO-8601 UTC.
 * - Amounts are already decimal strings (stroop conversion happens in tx-fetcher).
 * - Commas and double-quotes inside fields are escaped per RFC 4180.
 */
export function formatCsv(transactions: Transaction[]): string {
  const lines: string[] = [HEADERS.join(',')];

  for (const tx of transactions) {
    lines.push(
      [
        tx.timestamp,
        tx.hash,
        tx.type,
        tx.asset,
        tx.amount,
        tx.fee,
        tx.sender,
        tx.recipient,
      ]
        .map(csvEscape)
        .join(','),
    );
  }

  return lines.join('\n') + '\n';
}

/**
 * Escape a single field value for CSV output per RFC 4180.
 *
 * - If the value contains a comma, double-quote, or newline it is wrapped
 *   in double-quotes and any internal double-quotes are doubled.
 * - Otherwise it is returned as-is.
 */
export function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Convert a stroop value (integer string) to a decimal XLM string.
 *
 * Example: "700000000" -> "70.0000000"
 */
export function stroopsToXlm(stroops: string): string {
  const n = Number(stroops);
  if (!Number.isFinite(n)) {
    throw new Error(`Invalid stroop value: ${stroops}`);
  }
  return (n / 10_000_000).toFixed(7);
}

/**
 * Validate that a string is a recognised transaction type.
 */
export function isValidTxType(value: string): value is TxType {
  const valid: TxType[] = [
    'Wager Inflow',
    'Prize Payout',
    'Fee Revenue',
    'Staking Yield',
  ];
  return (valid as string[]).includes(value);
}
