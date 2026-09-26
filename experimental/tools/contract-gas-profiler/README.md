# contract-gas-profiler

A standalone CLI and library for estimating the CPU instruction, memory, and
storage footprint cost of invoking a Soroban smart contract function —
before you deploy it.

> **Status:** experimental, self-contained tool under `experimental/tools/`.
> It does not modify or depend on any core repo tooling.

## ⚠️ Simulated metrics — read this first

This tool does **not** run your contract on a real Soroban host, and it does
not call `soroban-cli` or any live network. Real host execution isn't
available in this environment, so `contract-gas-profiler` **estimates**
resource usage deterministically from:

1. A minimal static analysis of the compiled WASM binary (walking section
   headers to find the size of the `code` section — see
   `countCodeSectionBytes` in `src/profiler.ts`), and
2. A deterministic function of the invocation arguments (their count, size,
   and nesting), so that repeated runs with the same inputs always produce
   the same numbers.

These numbers are **directional estimates**, not a substitute for actual
`soroban-cli` simulation or on-chain execution. They are useful for:

- Regression-testing that a change to a contract doesn't blow up its
  estimated cost.
- CI gating (fail the build if an invocation's estimated CPU % exceeds a
  threshold).
- Quick, dependency-free sanity checks during local development.

The estimator is intentionally implemented behind a small interface
(`MetricsEstimator` in `types.ts`) so it can be swapped for a real
Soroban host-based measurement later without changing the CLI, the
programmatic API, or the report formatting:

```ts
export type MetricsEstimator = (
  wasmBuffer: Buffer,
  fnName: string,
  args: unknown[]
) => InvocationMetrics;
```

## Installation

```bash
cd experimental/tools/contract-gas-profiler
npm install
npm run build
```

## CLI usage

```
contract-gas-profiler --wasm <path> --fn <name> [--args <json>] [--max-cpu-pct <n>] [--json]
```

Flags:

| Flag | Required | Description |
|---|---|---|
| `--wasm <path>` | yes | Path to the compiled Soroban contract `.wasm` file |
| `--fn <name>` | yes | Name of the contract function to profile |
| `--args <json>` | no | JSON array of arguments to pass to the function (default `[]`) |
| `--max-cpu-pct <n>` | no | Warning threshold as a percentage of the max CPU instruction budget (default `100`) |
| `--threshold <n>` | no | Alias for `--max-cpu-pct` |
| `--json` | no | Print the raw `ProfileResult` as JSON instead of a formatted table |

### Examples

Profile a `transfer` call with default threshold:

```bash
npx ts-node src/index.ts \
  --wasm ../../../contracts/pattern-puzzle/target/wasm32-unknown-unknown/release/pattern_puzzle.wasm \
  --fn transfer \
  --args '[{"to":"GABC...","amount":100}]'
```

Fail CI if estimated CPU usage exceeds 80% of budget:

```bash
contract-gas-profiler \
  --wasm ./out/contract.wasm \
  --fn roll_dice \
  --args '[42]' \
  --max-cpu-pct 80
```

Exit codes:

- `0` — profiling succeeded and usage stayed within threshold
- `1` — profiling succeeded but the CPU threshold was exceeded
- `2` — an error occurred (bad args, missing file, etc.)

## Programmatic API

```ts
import { profileContract } from '@stellarcade/contract-gas-profiler';
import * as fs from 'fs';

const wasmBuffer = fs.readFileSync('./contract.wasm');

const result = await profileContract(wasmBuffer, 'transfer', [
  { to: 'GABC...', amount: 100 },
], {
  maxCpuPct: 80, // optional, default 100
});

console.log(result.cpuPct, result.exceededThreshold);
```

`profileContract(wasmBuffer, fnName, args, options?) => Promise<ProfileResult>`

`options`:
- `budget?: LedgerBudget` — override the default simulated ledger budget
- `maxCpuPct?: number` — warning threshold (default `100`)
- `estimator?: MetricsEstimator` — swap in a custom/real estimator
- `wasmPath?: string` — informational, included in the result/report

See `types.ts` for the full `ProfileResult`, `InvocationMetrics`, and
`LedgerBudget` shapes.

## Terminal output

`formatReport(result)` (exported from `src/profiler.ts`) renders a colored
ANSI table showing CPU instructions, memory bytes, and storage
reads/writes, each as a percentage of the configured budget with a small
bar chart (green < 75%, yellow 75–99%, red ≥ 100%).

## Development

```bash
npm run dev    # run the CLI via ts-node
npm test       # run the vitest suite
npm run build  # compile to dist/
```
