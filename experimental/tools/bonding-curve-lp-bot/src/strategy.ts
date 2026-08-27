import { asymptoticRatioBps } from './curve-math';
import type { BotConfig, PoolState, TradeDecision } from './types';

/**
 * A small deterministic PRNG (mulberry32) so `--seed` produces reproducible
 * trade sequences for dry-run/backtest use, the same convention used by
 * `experimental/tools/contract-fuzz-runner`.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns a float in [min, max). */
  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }
}

/**
 * Computes how far the pool's current `reserveRatioBps` has drifted from
 * the curve's own asymptotic equilibrium ratio (`10_000 / (exponent + 1)`
 * bps — see `curve-math.ts`), as a signed fraction: positive means the
 * pool is holding more reserve than the curve's steady state implies at
 * this supply (a young/thin market, still converging from below per the
 * contract's own `reserve_ratio_approaches_curve_asymptote` test — never
 * negative in practice for this curve, but the sign is kept general
 * rather than special-cased). The bot leans toward whichever side nudges
 * supply — and therefore the ratio — back toward that equilibrium faster.
 *
 * Unlike a constant-product AMM, this curve has no externally configurable
 * "target ratio": the equilibrium is a structural property of `slope` and
 * `exponent`, which is why this reads `pool.exponent` rather than a
 * `BotConfig` field.
 */
export function computeRatioDeviation(pool: PoolState): number {
  const target = asymptoticRatioBps(pool.exponent);
  if (target === 0) return 0;
  return (Number(pool.reserveRatioBps) - target) / target;
}

/**
 * Random-walk trade decision: picks a side with balanced buy/sell
 * probability by default (`driftBias = 0.5`), adjusted by:
 *  1. `config.driftBias` — a constant tilt toward buys or sells.
 *  2. The pool's reserve-ratio deviation from the curve's asymptotic
 *     equilibrium — the further below equilibrium the pool sits, the more
 *     the bot leans toward buying (growing supply pushes the ratio back up
 *     toward the asymptote), satisfying the "adjust buy/sell intensity
 *     when reserve ratio deviates from target" requirement.
 * Trade size is a uniformly random deposit-unit notional in
 * `[minTradeXlm, maxTradeXlm]`; a sell of the same notional is priced by
 * the executor at the pool's current spot rate (see `bot.ts`). Position
 * bounds are enforced in `bot.ts`, since that also depends on the current
 * open position and wallet balance.
 */
export function decideTrade(pool: PoolState, config: BotConfig, rng: SeededRandom): TradeDecision {
  const deviation = computeRatioDeviation(pool);
  // Clamp the ratio-deviation influence so one extreme pool state can't
  // fully override the configured drift bias.
  const deviationInfluence = Math.max(-0.4, Math.min(0.4, -deviation));
  const buyProbability = clamp01(config.driftBias + deviationInfluence);

  const side = rng.next() < buyProbability ? 'buy' : 'sell';
  const sizeXlm = rng.nextFloat(config.minTradeXlm, config.maxTradeXlm);

  const reason =
    Math.abs(deviationInfluence) > 0.05
      ? `reserve ratio deviates ${(deviation * 100).toFixed(1)}% from curve equilibrium, leaning ${side}`
      : `random walk (drift bias ${config.driftBias.toFixed(2)})`;

  return { side, sizeXlm, reason };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
