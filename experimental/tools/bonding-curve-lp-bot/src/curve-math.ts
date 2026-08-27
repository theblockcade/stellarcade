/**
 * Exact integer curve math, ported 1:1 from
 * `experimental/contracts/dynamic-bonding-curve/src/math.rs` so the
 * bot's `SimulatedExecutor` (see `bot.ts`) prices trades exactly the way
 * the real `DynamicBondingCurve` Soroban contract does:
 * `price(s) = slope * s^exponent`, `exponent` in `1..=3`.
 *
 * All functions use `bigint` (matching the contract's `u128`) and return
 * `null` on overflow/invalid input, mirroring the contract's
 * `Option<u128>` / `Result<_, Error>` — callers surface that as a
 * rejected trade rather than a thrown exception, since overflow is an
 * expected, handled outcome (e.g. "extreme deposit" in the contract's own
 * test suite) rather than a bug.
 */

const U128_MAX = (1n << 128n) - 1n;

function checkedMul(a: bigint, b: bigint): bigint | null {
  const result = a * b;
  return result > U128_MAX ? null : result;
}

function checkedAdd(a: bigint, b: bigint): bigint | null {
  const result = a + b;
  return result > U128_MAX ? null : result;
}

/** Sum of `s` for `s in 1..=x`: `x(x+1)/2`. */
function sumPow1(x: bigint): bigint | null {
  const a = x % 2n === 0n ? x / 2n : x;
  const b = x % 2n === 0n ? x + 1n : (x + 1n) / 2n;
  return checkedMul(a, b);
}

/** Sum of `s^2` for `s in 1..=x`: `x(x+1)(2x+1)/6`. */
function sumPow2(x: bigint): bigint | null {
  const a = checkedMul(x, x + 1n);
  if (a === null) return null;
  const b = 2n * x + 1n;
  const ab = checkedMul(a, b);
  if (ab === null) return null;
  return ab / 6n;
}

/** Sum of `s^3` for `s in 1..=x`: `(x(x+1)/2)^2`. */
function sumPow3(x: bigint): bigint | null {
  const t = sumPow1(x);
  if (t === null) return null;
  return checkedMul(t, t);
}

/** `m * sum(s^k for s in 1..=x)` — the reserve backing a supply of `x`. */
export function prefixCost(m: bigint, k: number, x: bigint): bigint | null {
  let sum: bigint | null;
  switch (k) {
    case 1:
      sum = sumPow1(x);
      break;
    case 2:
      sum = sumPow2(x);
      break;
    case 3:
      sum = sumPow3(x);
      break;
    default:
      return null;
  }
  if (sum === null) return null;
  return checkedMul(m, sum);
}

/** Cost to mint `amount` tokens starting from `supply`. */
export function buyCost(m: bigint, k: number, supply: bigint, amount: bigint): bigint | null {
  const end = checkedAdd(supply, amount);
  if (end === null) return null;
  const endCost = prefixCost(m, k, end);
  const startCost = prefixCost(m, k, supply);
  if (endCost === null || startCost === null) return null;
  return endCost - startCost;
}

/** Deposit returned for burning `amount` tokens from `supply`. */
export function sellReturn(m: bigint, k: number, supply: bigint, amount: bigint): bigint | null {
  if (amount > supply) return null;
  return buyCost(m, k, supply - amount, amount);
}

/** Price of the next token to mint: `m * (supply + 1)^k`. */
export function spotPrice(m: bigint, k: number, supply: bigint): bigint | null {
  const next = supply + 1n;
  let pow = 1n;
  for (let i = 0; i < k; i++) {
    const next_pow = checkedMul(pow, next);
    if (next_pow === null) return null;
    pow = next_pow;
  }
  return checkedMul(m, pow);
}

/** Largest `n` with `buyCost(supply, n) <= deposit`, via doubling + binary search (mirrors `math.rs`). */
export function maxTokensForDeposit(m: bigint, k: number, supply: bigint, deposit: bigint): bigint {
  const affordable = (n: bigint): boolean => {
    const cost = buyCost(m, k, supply, n);
    return cost !== null && cost <= deposit;
  };

  if (!affordable(1n)) return 0n;

  let hi = 1n;
  while (affordable(hi * 2n) && hi * 2n <= U128_MAX) {
    hi *= 2n;
  }
  let lo = hi;
  let probeHi = hi * 2n > U128_MAX ? U128_MAX : hi * 2n;
  while (lo + 1n < probeHi) {
    const mid = lo + (probeHi - lo) / 2n;
    if (affordable(mid)) {
      lo = mid;
    } else {
      probeHi = mid;
    }
  }
  return lo;
}

/**
 * Reserve ratio in basis points: `reserve / (spotPrice * supply)`.
 * Returns `0n` when supply is zero (mirrors the contract's
 * `get_pool_status`, which special-cases supply == 0 rather than
 * dividing by zero). Returns `null` on overflow.
 */
export function reserveRatioBps(reserve: bigint, spot: bigint, supply: bigint): bigint | null {
  if (supply === 0n) return 0n;
  const marketCap = checkedMul(spot, supply);
  if (marketCap === null || marketCap === 0n) return null;
  const scaled = checkedMul(reserve, 10_000n);
  if (scaled === null) return null;
  return scaled / marketCap;
}

/**
 * The reserve ratio (bps) this curve converges toward as supply grows,
 * `10_000 / (exponent + 1)`. This is a structural property of
 * `price(s) = m * s^k` (not a configurable parameter of the contract —
 * there is no `target_ratio` field on `PoolStatusSummary`), used as the
 * bot's deviation baseline: see `computeRatioDeviation` in `strategy.ts`.
 */
export function asymptoticRatioBps(exponent: number): number {
  return Math.floor(10_000 / (exponent + 1));
}
