'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { WagerHistoryTable } from './WagerHistoryTable';
import { exportToCsv } from './exportCsv';
import type { HistoryFilters, OutcomeFilter, WagerHistoryFilterProps } from './types';
import './WagerHistoryFilter.css';

const OUTCOME_OPTIONS: { value: OutcomeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'drawn', label: 'Drawn' },
];

function parseDateBoundary(value: string | null, endOfDay: boolean): number | null {
  if (!value) {
    return null;
  }
  const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
  const time = new Date(`${value}${suffix}`).getTime();
  return Number.isNaN(time) ? null : time;
}

export const WagerHistoryFilter: React.FC<WagerHistoryFilterProps> = ({
  records,
  onFilterChange,
  pageSize = 20,
  className = '',
  testId = 'wager-history-filter',
}) => {
  const gameOptions = useMemo(() => {
    const names = new Set(records.map((record) => record.gameName));
    return ['all', ...Array.from(names).sort()];
  }, [records]);

  const [game, setGame] = useState('all');
  const [outcome, setOutcome] = useState<OutcomeFilter>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const filters: HistoryFilters = useMemo(
    () => ({
      game,
      outcome,
      dateRange: { from: dateFrom || null, to: dateTo || null },
    }),
    [game, outcome, dateFrom, dateTo],
  );

  useEffect(() => {
    onFilterChange?.(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const filteredRecords = useMemo(() => {
    const fromMs = parseDateBoundary(filters.dateRange.from, false);
    const toMs = parseDateBoundary(filters.dateRange.to, true);

    return records.filter((record) => {
      if (filters.game !== 'all' && record.gameName !== filters.game) {
        return false;
      }
      if (filters.outcome !== 'all' && record.outcome !== filters.outcome) {
        return false;
      }
      const recordMs = new Date(record.timestamp).getTime();
      if (fromMs !== null && recordMs < fromMs) {
        return false;
      }
      if (toMs !== null && recordMs > toMs) {
        return false;
      }
      return true;
    });
  }, [records, filters]);

  const handleExport = () => {
    exportToCsv(filteredRecords);
  };

  return (
    <div className={`wager-history-filter ${className}`} data-testid={testId}>
      <div className="wager-history-filter__toolbar">
        <label className="wager-history-filter__field">
          <span className="wager-history-filter__label">Game</span>
          <select
            value={game}
            onChange={(event) => setGame(event.target.value)}
            data-testid={`${testId}-game`}
          >
            {gameOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All Games' : option}
              </option>
            ))}
          </select>
        </label>

        <div className="wager-history-filter__pills" role="group" aria-label="Filter by outcome">
          {OUTCOME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`wager-history-filter__pill ${
                outcome === option.value ? 'wager-history-filter__pill--active' : ''
              }`}
              aria-pressed={outcome === option.value}
              onClick={() => setOutcome(option.value)}
              data-testid={`${testId}-outcome-${option.value}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="wager-history-filter__field">
          <span className="wager-history-filter__label">From</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            data-testid={`${testId}-date-from`}
          />
        </label>
        <label className="wager-history-filter__field">
          <span className="wager-history-filter__label">To</span>
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            data-testid={`${testId}-date-to`}
          />
        </label>

        <button
          type="button"
          className="wager-history-filter__export-btn"
          onClick={handleExport}
          disabled={filteredRecords.length === 0}
          data-testid={`${testId}-export`}
        >
          Export CSV
        </button>
      </div>

      <WagerHistoryTable
        records={filteredRecords}
        pageSize={pageSize}
        testId={`${testId}-table`}
      />
    </div>
  );
};

WagerHistoryFilter.displayName = 'WagerHistoryFilter';
export default WagerHistoryFilter;
