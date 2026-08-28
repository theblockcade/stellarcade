# @stellarcade/event-catalog-generator

Parses Soroban contract Rust sources for `env.events().publish()` call sites and generates a unified Markdown documentation catalog plus a machine-readable JSON Schema, for SDK and indexer developers who need to know every event topic and payload shape a contract can emit.

## Features

- Scans every `src/lib.rs` under a directory, recursively
- Extracts topic Symbols from `Symbol::new(&env, "...")` and `symbol_short!("...")`
- Infers payload field names (and types, where a cast like `x as i128` makes one statically visible) from the `data` argument
- Preserves unrecognized topic expressions (e.g. a variable) as raw text rather than dropping them
- Outputs Markdown (human-readable) or JSON Schema (indexer-consumable)

## Installation

```bash
npm install @stellarcade/event-catalog-generator
```

## Usage

```bash
npx tsx src/index.ts --contracts-dir ./contracts --format markdown
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--contracts-dir <path>` | Directory to scan for `lib.rs` files (recursively) | `.` |
| `--format <markdown\|json>` | Output format | `markdown` |
| `--out <path>` | Write output to this file instead of stdout | |
| `-V, --version` | Output the version number | |
| `-h, --help` | Display help for command | |

### Sample generated event catalog

Given a contract with:

```rust
pub fn place_wager(env: Env, player: Address, amount: i128) {
    env.events().publish((Symbol::new(&env, "wager_placed"), player.clone()), amount);
}
```

`--format markdown` produces:

```markdown
# Contract Event Catalog

Scanned 1 contract file(s), found 1 event(s).

| Topics | Payload Fields | Source |
|---|---|---|
| `wager_placed`, `player.clone()` | `amount: unknown` | contracts/coinflip/src/lib.rs:12 |
```

`--format json` produces a JSON Schema document with a `definitions.events`
array (one entry per discovered call, carrying its topics, inferred
payload property types, and source location) alongside a top-level
`items` schema an indexer can validate decoded events against.

### Examples

Markdown to stdout:
```bash
npx tsx src/index.ts --contracts-dir ./contracts
```

JSON schema to a file:
```bash
npx tsx src/index.ts --contracts-dir ./contracts --format json --out events.schema.json
```

## Scope note

This is a lexical scanner, not a full Rust parser. Topic/field extraction
is best-effort:

- Only `Symbol::new(&env, "...")` and `symbol_short!("...")` topics resolve to their literal string value; any other topic expression (a variable, a computed Symbol) is preserved as raw source text.
- Payload field *names* are inferred from bare-identifier tuple elements (`(player, amount)`); field *types* are only known when the source makes them explicit via an `as` cast — otherwise the type is reported as `unknown` rather than guessed.
- A `data` argument that isn't a positional tuple (e.g. a struct literal) is not destructured into named fields.

These gaps mean the catalog can under-document a payload's shape, never
fabricate one — an `unknown`-typed field always reflects a real field that
genuinely wasn't statically inferable from the call site.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run in development mode
npm run dev
```

## License

MIT
