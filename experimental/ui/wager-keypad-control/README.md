# wager-keypad-control

Mobile-friendly numeric wager keypad with quick-multiplier buttons (½X, 2X, MAX, MIN), backspace, and live balance validation.

## Usage

```tsx
import { WagerKeypadControl } from "@stellarcade/wager-keypad-control";

const [wager, setWager] = useState("0");

<WagerKeypadControl
  value={wager}
  maxBalance={1000}
  minBet={1}
  onChange={setWager}
  onSubmit={() => placeBet(wager)}
/>
```

## Behavior

- Numeric keys (0-9), a decimal point, and backspace build up the `value` string. A second decimal point is ignored; a leading `0` is replaced (not prefixed) by the first digit typed.
- `½X` and `2X` halve/double the current value; `MAX`/`MIN` jump to `maxBalance`/`minBet`. All four clamp their result to `[minBet, maxBalance]`.
- The value display turns red (`wager-value-display--invalid`) when the current value exceeds `maxBalance`.
- The submit button (rendered only when `onSubmit` is passed) is disabled when the value is `0` or exceeds `maxBalance`.

## Props

| Prop | Type | Description |
|---|---|---|
| `value` | `string` | Current wager value as an editable string. |
| `maxBalance` | `number` | Upper bound for the wager. |
| `minBet` | `number` | Table minimum. |
| `onChange` | `(val: string) => void` | Called on every keystroke and multiplier action. |
| `onSubmit` | `() => void` | Optional. Renders a submit button when provided. |

## Development

```bash
npm install
npm test
```
