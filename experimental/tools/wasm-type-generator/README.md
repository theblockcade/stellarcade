# Soroban WASM TypeScript Type Generator CLI

A Node.js / TypeScript CLI utility that parses custom metadata sections (`contractspecv0` and `contractenvmetav0`) from compiled Soroban contract `.wasm` bytecode and generates strictly typed TypeScript client interface definitions.

## Features

- **WASM Bytecode Parser**: Direct extraction of custom sections (`contractspecv0` / `contractenvmetav0`) without external binary dependencies.
- **Full Type Mapping**: Maps Soroban types (`Symbol`, `Address`, `u64`/`u128`, `Vec`, `Map`, `Option`, `Result`, `Tuple`) to clean TypeScript primitives (`string`, `bigint`, `Array`, `Map`, `boolean`, `Uint8Array`).
- **Complete ABI Generation**: Emits TypeScript enums, interfaces, union types, and an exported `SorobanContractClient` interface for client integration.
- **Doc Comment Preservation**: Retains inline Soroban doc comments across emitted TS code.

## Usage

```bash
npx tsx src/index.ts --wasm <path/to/contract.wasm> --out <path/to/types.ts>
```

### Options

- `-w, --wasm <path>` (required): Path to the compiled Soroban contract `.wasm` file.
- `-o, --out <path>` (required): Target output path for the generated `.ts` or `.d.ts` definitions.

### Example

```bash
npx tsx src/index.ts \
  --wasm ../../../contracts/target/wasm32-unknown-unknown/release/coin_flip.wasm \
  --out ./generated/coin-flip-types.ts
```

## Testing

Run unit tests with Vitest:

```bash
npx vitest run
```
