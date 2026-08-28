# Mock Client Generator

CLI tool that parses Soroban smart contract Rust source and generates a TypeScript mock client class with identical method signatures, configurable return values, latency simulation, and error/panic simulation.

## Usage

```bash
npx tsx src/index.ts --contract-dir ./contracts/token --out ./MockTokenClient.ts
```

### Options

| Option | Description |
|---|---|
| `--contract-dir <path>` | Path to the Rust contract crate directory (required) |
| `--out <path>` | Output path for the generated MockClient.ts (required) |
| `--contract-name <name>` | Contract name prefix (defaults to directory name) |
| `--latency <ms>` | Default simulated latency in milliseconds for all methods |
| `--include-error-simulation` | Include error/panic simulation helpers in the generated class |

## What It Parses

The contract parser reads `src/lib.rs` (or `lib.rs` at crate root) and extracts:

- **Public functions** (`pub fn name(...)`) with their arguments and return types
- **Doc comments** (`/// ...`) immediately before functions
- Skips `env: &Env` first parameters (Soroban convention)
- Handles generic types: `Map<Address, i128>`, `Vec<u8>`, `Option<Address>`, `BytesN<32>`

## What It Generates

### Mock Client Class

```typescript
export class MockTokenClient {
  async transfer(to: string, amount: number): Promise<boolean> { ... }
  async get_balance(account: string): Promise<number> { ... }

  // Runtime configuration
  mockReturnValue(method: string, value: unknown): void;
  mockThrow(method: string, symbol: string): void;
  mockSucceedThenThrow(method: string, succeedCount: number, throwSymbol: string): void;
  reset(): void;
  getCallCount(method: string): number;
}
```

### Runtime Configuration

```typescript
const client = new MockTokenClient(config);

// Override return values
client.mockReturnValue('transfer', true);

// Simulate contract errors
client.mockThrow('transfer', 'InsufficientBalance');

// Succeed 3 times, then throw
client.mockSucceedThenThrow('transfer', 3, 'Unauthorized');

// Check call counts
client.getCallCount('transfer'); // → 3
```

### Config File

A `<MockClient>.config.json` is also written alongside the generated file, containing default return values and latency settings for each method.

## Type Mapping

| Rust Type | TypeScript |
|---|---|
| `String`, `&str` | `string` |
| `bool` | `boolean` |
| `u32`, `i64`, `u128`, etc. | `number` |
| `Address` | `string` |
| `Bytes`, `BytesN<32>` | `string` (hex) |
| `Option<T>` | `T \| null` |
| `Vec<T>` | `unknown[]` |
| `Map<K, V>` | `Record<string, unknown>` |
