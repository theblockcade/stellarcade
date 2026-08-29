# Wager Mini Dropdown

Compact wager history popover for the experimental UI workspace.

## Features

- Trigger button with a history icon and unread win indicator.
- Popover showing the five most recent wagers sorted by timestamp.
- Game icon, wager time, wager amount, win/loss/refund status, profit delta, and transaction explorer link per row.
- Empty state when the player has not placed recent wagers.
- Outside-click dismissal and a `View Full History` callback.

## Usage

```tsx
import { WagerMiniDropdown } from './wager-mini-dropdown/WagerMiniDropdown';
import type { WagerSummary } from './wager-mini-dropdown/types';

const wagers: WagerSummary[] = [
  {
    id: 'w1',
    gameName: 'Coinflip',
    gameIcon: '????',
    timestamp: '2026-08-29T12:00:00.000Z',
    wagerAmountXlm: 15,
    netProfitXlm: 22.5,
    outcome: 'won',
    txHash: 'abc123...',
  },
];

<WagerMiniDropdown
  recentWagers={wagers}
  onViewFullHistory={() => navigate('/history')}
  onSelectWager={(txHash) => openTransaction(txHash)}
/>;
```

## Props

| Prop | Type | Description |
|---|---|---|
| `recentWagers` | `WagerSummary[]` | Player wager summaries. The dropdown shows the newest five. |
| `onViewFullHistory` | `() => void` | Called when the history action is selected. |
| `onSelectWager` | `(txHash: string) => void` | Optional row selection callback. |
| `explorerBaseUrl` | `string` | Optional Stellar explorer base URL. |
| `className` | `string` | Optional root class name. |
| `testId` | `string` | Optional test id prefix. |