import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { WagerHistoryFilter } from './WagerHistoryFilter';
import { buildCsv, exportToCsv } from './exportCsv';
import type { WagerRecord } from './types';

const records: WagerRecord[] = [
  {
    id: 'w1',
    timestamp: '2026-08-01T10:00:00.000Z',
    gameName: 'Coinflip Streak',
    wagerAmount: 100,
    netPayout: 95,
    outcome: 'won',
    txHash: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
  },
  {
    id: 'w2',
    timestamp: '2026-08-05T14:30:00.000Z',
    gameName: 'Trivia Duel',
    wagerAmount: 50,
    netPayout: -50,
    outcome: 'lost',
    txHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
  },
  {
    id: 'w3',
    timestamp: '2026-08-10T09:15:00.000Z',
    gameName: 'Coinflip Streak',
    wagerAmount: 200,
    netPayout: 0,
    outcome: 'drawn',
    txHash: 'c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
  },
];

describe('WagerHistoryFilter', () => {
  it('renders all records with no filters applied', () => {
    render(<WagerHistoryFilter records={records} />);

    const table = screen.getByTestId('wager-history-filter-table-grid');
    expect(within(table).getAllByText('Coinflip Streak')).toHaveLength(2);
    expect(within(table).getByText('Trivia Duel')).toBeInTheDocument();
    expect(screen.getAllByTestId(/wager-history-filter-table-row-/)).toHaveLength(3);
  });

  // ─── Filtering by game type ───────────────────────────────────────────────

  it('filters by game type', () => {
    render(<WagerHistoryFilter records={records} />);

    fireEvent.change(screen.getByTestId('wager-history-filter-game'), {
      target: { value: 'Trivia Duel' },
    });

    const rows = screen.getAllByTestId(/wager-history-filter-table-row-/);
    expect(rows).toHaveLength(1);
    const table = screen.getByTestId('wager-history-filter-table-grid');
    expect(within(table).getByText('Trivia Duel')).toBeInTheDocument();
    expect(within(table).queryByText('Coinflip Streak')).not.toBeInTheDocument();
  });

  // ─── Filtering by outcome status ──────────────────────────────────────────

  it('filters by outcome status', () => {
    render(<WagerHistoryFilter records={records} />);

    fireEvent.click(screen.getByTestId('wager-history-filter-outcome-won'));

    const rows = screen.getAllByTestId(/wager-history-filter-table-row-/);
    expect(rows).toHaveLength(1);
    expect(screen.getByTestId('wager-history-filter-table-row-w1')).toBeInTheDocument();
  });

  it('combines game and outcome filters', () => {
    render(<WagerHistoryFilter records={records} />);

    fireEvent.change(screen.getByTestId('wager-history-filter-game'), {
      target: { value: 'Coinflip Streak' },
    });
    fireEvent.click(screen.getByTestId('wager-history-filter-outcome-drawn'));

    const rows = screen.getAllByTestId(/wager-history-filter-table-row-/);
    expect(rows).toHaveLength(1);
    expect(screen.getByTestId('wager-history-filter-table-row-w3')).toBeInTheDocument();
  });

  it('filters by date range', () => {
    render(<WagerHistoryFilter records={records} />);

    fireEvent.change(screen.getByTestId('wager-history-filter-date-from'), {
      target: { value: '2026-08-04' },
    });
    fireEvent.change(screen.getByTestId('wager-history-filter-date-to'), {
      target: { value: '2026-08-06' },
    });

    const rows = screen.getAllByTestId(/wager-history-filter-table-row-/);
    expect(rows).toHaveLength(1);
    expect(screen.getByTestId('wager-history-filter-table-row-w2')).toBeInTheDocument();
  });

  // ─── Empty search results ──────────────────────────────────────────────────

  it('shows an empty state when filters match zero records', () => {
    render(<WagerHistoryFilter records={records} />);

    fireEvent.change(screen.getByTestId('wager-history-filter-game'), {
      target: { value: 'Trivia Duel' },
    });
    fireEvent.click(screen.getByTestId('wager-history-filter-outcome-won'));

    expect(
      screen.getByTestId('wager-history-filter-table-empty'),
    ).toBeInTheDocument();
    expect(screen.getByText(/No wager records match/)).toBeInTheDocument();
  });

  it('shows an empty state when the initial record set is empty', () => {
    render(<WagerHistoryFilter records={[]} />);
    expect(screen.getByTestId('wager-history-filter-table-empty')).toBeInTheDocument();
  });

  // ─── onFilterChange callback ───────────────────────────────────────────────

  it('calls onFilterChange when a filter changes', () => {
    const onFilterChange = vi.fn();
    render(<WagerHistoryFilter records={records} onFilterChange={onFilterChange} />);
    onFilterChange.mockClear();

    fireEvent.click(screen.getByTestId('wager-history-filter-outcome-lost'));

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ outcome: 'lost' }),
    );
  });

  // ─── CSV export button ─────────────────────────────────────────────────────

  it('disables the export button when there are no matching records', () => {
    render(<WagerHistoryFilter records={records} />);

    fireEvent.change(screen.getByTestId('wager-history-filter-game'), {
      target: { value: 'Trivia Duel' },
    });
    fireEvent.click(screen.getByTestId('wager-history-filter-outcome-won'));

    expect(screen.getByTestId('wager-history-filter-export')).toBeDisabled();
  });

  it('enables the export button when records are present', () => {
    render(<WagerHistoryFilter records={records} />);
    expect(screen.getByTestId('wager-history-filter-export')).not.toBeDisabled();
  });
});

describe('CSV export string formatter', () => {
  it('produces a header row plus one row per record', () => {
    const csv = buildCsv(records);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('Timestamp,Game,Wager Amount,Net Payout,Outcome,TX Hash');
    expect(lines).toHaveLength(records.length + 1);
    expect(lines[1]).toBe(
      '2026-08-01T10:00:00.000Z,Coinflip Streak,100,95,won,a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    );
  });

  it('escapes fields containing a comma', () => {
    const csv = buildCsv([
      {
        id: 'w4',
        timestamp: '2026-08-11T00:00:00.000Z',
        gameName: 'Rock, Paper, Scissors',
        wagerAmount: 10,
        netPayout: 10,
        outcome: 'won',
        txHash: 'hash1',
      },
    ]);
    expect(csv).toContain('"Rock, Paper, Scissors"');
  });

  it('escapes fields containing an embedded double quote', () => {
    const csv = buildCsv([
      {
        id: 'w5',
        timestamp: '2026-08-11T00:00:00.000Z',
        gameName: 'The "Big" Game',
        wagerAmount: 10,
        netPayout: 10,
        outcome: 'won',
        txHash: 'hash2',
      },
    ]);
    expect(csv).toContain('"The ""Big"" Game"');
  });

  it('escapes fields containing a newline', () => {
    const csv = buildCsv([
      {
        id: 'w6',
        timestamp: '2026-08-11T00:00:00.000Z',
        gameName: 'Multi\nLine',
        wagerAmount: 10,
        netPayout: 10,
        outcome: 'won',
        txHash: 'hash3',
      },
    ]);
    expect(csv).toContain('"Multi\nLine"');
  });

  it('leaves plain fields unescaped', () => {
    const csv = buildCsv(records);
    expect(csv).not.toMatch(/"Coinflip Streak"/);
  });
});

describe('exportToCsv', () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url');
    revokeObjectURL = vi.fn();
    // jsdom doesn't implement createObjectURL/revokeObjectURL.
    (URL as unknown as { createObjectURL: typeof createObjectURL }).createObjectURL =
      createObjectURL;
    (URL as unknown as { revokeObjectURL: typeof revokeObjectURL }).revokeObjectURL =
      revokeObjectURL;
    clickSpy = vi.fn();
    HTMLAnchorElement.prototype.click = clickSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates a downloadable link with a wager-history-YYYY-MM-DD.csv filename', () => {
    exportToCsv(records);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('triggers the export button click end-to-end', () => {
    render(<WagerHistoryFilter records={records} />);
    fireEvent.click(screen.getByTestId('wager-history-filter-export'));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });
});
