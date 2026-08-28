# Wager History Filter

A filterable, paginated match wager history table with a date range picker, game type filter, outcome pills, and CSV export.

## Features

- **Filter Toolbar**: Game dropdown (populated from the record set), outcome pills (All / Won / Lost / Drawn), and a date range picker
- **Paginated Table**: Timestamp, game name, wager amount, net payout (color-coded), and a linked, truncated TX hash
- **CSV Export**: Exports the currently filtered records to `wager-history-YYYY-MM-DD.csv`, with RFC 4180-compliant escaping for values containing commas, quotes, or newlines
- **Empty State**: Shown both when the source record set is empty and when active filters match zero records
- **Mobile Responsive**: Falls back to a stacked card layout below 640px

## Installation

```bash
# Copy the component to your project
cp -r experimental/ui/wager-history-filter /path/to/your/components/
```

## Usage

```tsx
import { WagerHistoryFilter } from './wager-history-filter/WagerHistoryFilter';
import type { WagerRecord } from './wager-history-filter/types';

function WagerHistoryPage() {
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
    // ...
  ];

  return (
    <WagerHistoryFilter
      records={records}
      onFilterChange={(filters) => console.log('Filters changed:', filters)}
      pageSize={20}
    />
  );
}
```

## Props

### `WagerHistoryFilter`

| Prop | Type | Description |
|---|---|---|
| `records` | `WagerRecord[]` | Full (unfiltered) set of wager records |
| `onFilterChange` | `(filters: HistoryFilters) => void?` | Called whenever the active filters change |
| `pageSize` | `number?` | Rows per page in the underlying table (default `20`) |
| `className` | `string?` | Additional class name on the root element |
| `testId` | `string?` | Optional root `data-testid` override (default `wager-history-filter`) |

### `WagerRecord`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | Unique record id |
| `timestamp` | `string` | ISO 8601 match timestamp |
| `gameName` | `string` | Game the wager was placed on |
| `wagerAmount` | `number` | Amount wagered |
| `netPayout` | `number` | Positive on a win, negative on a loss, `0` on a draw/refund |
| `outcome` | `'won' \| 'lost' \| 'drawn'` | Match outcome |
| `txHash` | `string` | On-chain transaction hash, linked to a block explorer |

## Exporting programmatically

`exportCsv.ts` also exports `buildCsv(records)` (the raw CSV string, useful for testing or server-side generation) separately from `exportToCsv(records)` (which additionally triggers a browser download).

## Running tests

```bash
# Run tests
npm test WagerHistory.test.tsx
```
