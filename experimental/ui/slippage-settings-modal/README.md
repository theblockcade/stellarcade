# Slippage & Transaction Fee Settings Modal

An experimental modal component letting players fine-tune Soroban transaction
preferences: priority fee tier, slippage tolerance, and transaction deadline.

## Features

- **Priority Fee Selector**: Base (standard fee), Fast (1.5x fee), or Custom (manual stroop input)
- **Slippage Tolerance Chips**: 0.1%, 0.5%, 1.0% presets, or a Custom numeric input
- **High Slippage Warning**: Renders a warning alert when tolerance exceeds 5%
- **Transaction Deadline**: 5 / 10 / 20 minute dropdown
- **Reset to Defaults**: One-click restore of base fee tier, 0.5% slippage, 10 min deadline
- **Boundary Validation**: Slippage clamped to [0, 50]%, custom fee clamped to a sane stroop range
- **Explainer Copy**: Plain-language summary of how slippage affects wagers and swaps

## Installation

```bash
# Copy the component to your project
cp -r experimental/ui/slippage-settings-modal /path/to/your/components/
```

## Usage

```tsx
import { SlippageSettingsModal } from './slippage-settings-modal/SlippageSettingsModal';
import { DEFAULT_TX_SETTINGS } from './slippage-settings-modal/types';
import type { TxSettings } from './slippage-settings-modal/types';

function TransactionSettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<TxSettings>(DEFAULT_TX_SETTINGS);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Transaction Settings</button>
      <SlippageSettingsModal
        isOpen={isOpen}
        initialSettings={settings}
        onSave={setSettings}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| `isOpen` | `boolean` | Controls modal visibility |
| `initialSettings` | `TxSettings` | Settings to populate the modal with on open |
| `onSave` | `(settings: TxSettings) => void` | Called with the validated settings when Save is clicked |
| `onClose` | `() => void` | Called on close (X button, backdrop click, ESC, or after a successful save) |
| `className` | `string` | Additional CSS classes |
| `testId` | `string` | Base test ID (default: `'slippage-settings-modal'`) |

## `TxSettings`

```typescript
interface TxSettings {
  feeTier: 'base' | 'fast' | 'custom';
  customFeeStroops?: number;
  slippageTolerancePct: number;
  deadlineMinutes: number;
}
```

## Validation Rules

- Slippage tolerance must be between 0% and 50% inclusive.
- Custom fee must be between 100 and 10,000,000 stroops inclusive.
- The Save button is disabled while any validation error is present.
- A warning banner (non-blocking) renders whenever slippage exceeds 5%.

## Testing

```bash
npm test SlippageSettingsModal.test.tsx
```

Tests cover: preset chip selection, custom fee/slippage input + boundary
validation errors, the high-slippage warning threshold, deadline selection,
reset-to-defaults, and the save/close callback contract.

## Known Limitations / Follow-ups

- This component has no local `package.json`; like the other `experimental/ui/`
  widgets it is meant to be copied into a host app that already provides
  React, a test runner (Vitest + Testing Library), and a CSS pipeline.
- Styling assumes a dark host background (matches the other experimental
  modals in this directory); no light-theme variant is provided yet.
- `npm test` has not been executed in this environment (no local
  Node/npm/Vitest sandbox with the host app's dependencies installed); the
  test file was written and reviewed by hand against the component's actual
  behavior and existing sibling test suites' conventions.

## License

MIT
