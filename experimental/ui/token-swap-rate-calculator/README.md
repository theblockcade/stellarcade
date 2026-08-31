# TokenSwapRateCalculator

An experimental widget that quotes a token swap: enter an amount, see the converted output, adjust slippage tolerance via a slider or presets, and get a minimum-received guarantee before confirming.

## Features
- Live output amount as the input amount changes, based on a supplied exchange rate and fee percent
- Slippage tolerance via a native range slider (0.1%–10%) plus quick presets (0.1% / 0.5% / 1%)
- High-slippage warning above 5%
- Fee and minimum-received breakdown before swapping

## Usage
```tsx
import { TokenSwapRateCalculator } from './TokenSwapRateCalculator';

<TokenSwapRateCalculator
  fromSymbol="XLM"
  toSymbol="ARCADE"
  exchangeRate={2}
  feePercent={0.3}
  onSwap={(amount, slippagePct) => executeSwap(amount, slippagePct)}
/>
```

## Status

Experimental — not wired into the main app. See `experimental/README.md` for how components here graduate into `apps/web`.
