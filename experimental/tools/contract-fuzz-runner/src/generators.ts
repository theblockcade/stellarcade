import type { BoundaryValue, ContractFunctionSpec, FunctionCall, ParamSpec, ParamType } from './types';

export const U32_MAX = 0xffffffff;
export const U64_MAX = 18446744073709551615n;
export const U128_MAX = (1n << 128n) - 1n;
export const I128_MIN = -(1n << 127n);
export const I128_MAX = (1n << 127n) - 1n;

/**
 * A small deterministic PRNG (mulberry32) so a `--seed` reproduces the
 * exact same sequence of generated calls across runs, per the
 * "Reproducible runs given the same random seed" acceptance criterion.
 * `Math.random()` is intentionally not used anywhere in this module for
 * that reason.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    // Force a 32-bit unsigned starting state so 0/negative seeds behave.
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

  /** Returns an integer in [min, max] inclusive. */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Picks a uniformly random element from a non-empty array. */
  pick<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty array');
    }
    return items[this.nextInt(0, items.length - 1)];
  }

  /** True with probability `p` (0..1). */
  chance(p: number): boolean {
    return this.next() < p;
  }
}

/**
 * Boundary-focused candidate values for each supported parameter type.
 * These are weighted toward edge cases (0, 1, max) per the issue's
 * "boundary input values" requirement, with a handful of "normal" mid
 * range values mixed in so sequences aren't exclusively degenerate.
 */
function boundaryCandidates(type: ParamType, rng: SeededRandom): Array<BoundaryValue | string> {
  switch (type) {
    case 'u32':
      return [0, 1, U32_MAX, U32_MAX - 1, rng.nextInt(2, U32_MAX - 2)];
    case 'u64':
      return [0n, 1n, U64_MAX, U64_MAX - 1n, BigInt(rng.nextInt(2, 1_000_000))];
    case 'u128':
      return [0n, 1n, U128_MAX, U128_MAX - 1n, BigInt(rng.nextInt(2, 1_000_000))];
    case 'i128':
      return [0n, 1n, -1n, I128_MIN, I128_MAX, BigInt(rng.nextInt(-1_000_000, 1_000_000))];
    case 'address':
      // Synthetic address-shaped identifiers; a real target would map
      // these to funded test accounts / contract addresses.
      return ['GADDR_ZERO', 'GADDR_A', 'GADDR_B', `GADDR_${rng.nextInt(0, 999)}`];
    case 'vec':
      return ['[]', `[${rng.nextInt(1, 5)} items]`, `[${rng.nextInt(50, 100)} items]`];
    case 'string':
      return ['', 'a', 'x'.repeat(rng.nextInt(1, 32)), 'x'.repeat(256)];
    default:
      return [0];
  }
}

/** Generates one random boundary-weighted value for a single parameter. */
export function generateValue(param: ParamSpec, rng: SeededRandom): BoundaryValue | string {
  const candidates = boundaryCandidates(param.type, rng);
  return rng.pick(candidates);
}

/** Generates a full randomized argument set for one function's parameters. */
export function generateArgs(spec: ContractFunctionSpec, rng: SeededRandom): Record<string, BoundaryValue | string> {
  const args: Record<string, BoundaryValue | string> = {};
  for (const param of spec.params) {
    args[param.name] = generateValue(param, rng);
  }
  return args;
}

/**
 * Generates one random call against a randomly-chosen function from
 * `functions`.
 */
export function generateCall(functions: ContractFunctionSpec[], rng: SeededRandom): FunctionCall {
  const spec = rng.pick(functions);
  return { functionName: spec.name, args: generateArgs(spec, rng) };
}

/**
 * Generates a sequence of `length` random calls. This is the building
 * block for the "randomized sequences of contract function invocations"
 * requirement — the fuzzer drives full sequences (e.g. create -> deposit
 * -> withdraw -> withdraw again) by repeatedly calling this rather than
 * evaluating each function in isolation.
 */
export function generateSequence(functions: ContractFunctionSpec[], length: number, rng: SeededRandom): FunctionCall[] {
  const sequence: FunctionCall[] = [];
  for (let i = 0; i < length; i++) {
    sequence.push(generateCall(functions, rng));
  }
  return sequence;
}
