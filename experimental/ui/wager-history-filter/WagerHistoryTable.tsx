'use client';

import React, { useMemo, useState } from 'react';
import type { WagerHistoryTableProps } from './types';

const OUTCOME_LABELS: Record<string, string> = {
  won: 'Won',
  lost: 'Lost',
  drawn: 'Drawn',
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString();
}

function formatAmount(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function truncateHash(hash: string): string {
  if (hash.length <= 12) {
    return hash;
  }
  return `${hash.slice(0, 6)}…${hash.slice(-4)}`;
}

export const WagerHistoryTable: React.FC<WagerHistoryTableProps> = ({
  records,
  pageSize = 20,
  txExplorerBaseUrl = 'https://stellar.expert/explorer/testnet/tx',
  testId = 'wager-history-table',
}) => {
  const [page, setPage] = useState(0);

  // Reset to the first page whenever the underlying (already-filtered) set
  // of records changes, so a filter change never leaves the view stranded
  // on a now out-of-range page.
  const recordsKey = records.length > 0 ? `${records.length}:${records[0]?.id}` : '0';
  const [lastRecordsKey, setLastRecordsKey] = useState(recordsKey);
  if (recordsKey !== lastRecordsKey) {
    setLastRecordsKey(recordsKey);
    if (page !== 0) {
      setPage(0);
    }
  }

  const pageCount = Math.max(1, Math.ceil(records.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);

  const pageRecords = useMemo(() => {
    const start = clampedPage * pageSize;
    return records.slice(start, start + pageSize);
  }, [records, clampedPage, pageSize]);

  return (
    <div className="wager-history-table" data-testid={testId}>
      {records.length === 0 ? (
        <div className="wager-history-table__empty" data-testid={`${testId}-empty`}>
          No wager records match the current filters.
        </div>
      ) : (
        <>
          <table className="wager-history-table__table" data-testid={`${testId}-grid`}>
            <thead>
              <tr>
                <th scope="col">Timestamp</th>
                <th scope="col">Game</th>
                <th scope="col">Wager</th>
                <th scope="col">Net Payout</th>
                <th scope="col">Outcome</th>
                <th scope="col">Transaction</th>
              </tr>
            </thead>
            <tbody>
              {pageRecords.map((record) => (
                <tr key={record.id} data-testid={`${testId}-row-${record.id}`}>
                  <td data-label="Timestamp">{formatTimestamp(record.timestamp)}</td>
                  <td data-label="Game">{record.gameName}</td>
                  <td data-label="Wager">{record.wagerAmount.toLocaleString()}</td>
                  <td
                    data-label="Net Payout"
                    className={`wager-history-table__payout wager-history-table__payout--${
                      record.netPayout > 0 ? 'positive' : record.netPayout < 0 ? 'negative' : 'neutral'
                    }`}
                  >
                    {formatAmount(record.netPayout)}
                  </td>
                  <td data-label="Outcome">
                    <span
                      className={`wager-history-table__outcome-chip wager-history-table__outcome-chip--${record.outcome}`}
                    >
                      {OUTCOME_LABELS[record.outcome] ?? record.outcome}
                    </span>
                  </td>
                  <td data-label="Transaction">
                    <a
                      href={`${txExplorerBaseUrl}/${record.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wager-history-table__tx-link"
                      title={record.txHash}
                    >
                      {truncateHash(record.txHash)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pageCount > 1 && (
            <div className="wager-history-table__pagination" data-testid={`${testId}-pagination`}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={clampedPage === 0}
                data-testid={`${testId}-prev`}
              >
                Previous
              </button>
              <span className="wager-history-table__page-indicator">
                Page {clampedPage + 1} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={clampedPage >= pageCount - 1}
                data-testid={`${testId}-next`}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

WagerHistoryTable.displayName = 'WagerHistoryTable';
export default WagerHistoryTable;
