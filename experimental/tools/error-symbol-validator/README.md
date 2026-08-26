# Error Symbol Validator

A Node.js/TypeScript CLI utility that validates all Soroban contract error symbols are properly mapped in the typed SDK, catching missing or mismatched error definitions before they reach production.

## Features

- **Contract Symbol Extraction**: Scans `.rs` files for `Symbol::new`, `#[contracterror]` enums, and `panic_with_error!` macros
- **SDK Mapping Extraction**: Parses TypeScript/JavaScript SDK files for error message mappings
- **Discrepancy Detection**: Identifies symbols missing in SDK, missing in contracts, and message mismatches
- **Markdown Reports**: Export validation results as a markdown table for CI or documentation
- **Colored Terminal Output**: Human-readable output with chalk for quick visual scanning

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
node dist/index.js [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--contracts-dir <path>` | Path to contracts source directory | `./contracts` |
| `--sdk-dir <path>` | Path to SDK package directory | `./packages/typed-api-sdk` |
| `--export-markdown <path>` | Export validation report as markdown | (none) |

### Examples

```bash
# Validate with default paths
node dist/index.js

# Specify custom directories
node dist/index.js --contracts-dir ./smart-contracts --sdk-dir ./sdk

# Export markdown report for CI
node dist/index.js --export-markdown ./validation-report.md
```

### What Gets Extracted

**From contracts (`.rs` files):**
- `Symbol::new(&env, "SYMBOL_NAME")` patterns
- `#[contracterror]` enum variants (e.g., `TokenError::InsufficientBalance`)
- `panic_with_error!(&env, ErrorType::Variant)` patterns

**From SDK (`.ts`/`.js` files):**
- Object literal entries: `ERROR_NAME: "Error message"`
- Constant assignments: `const ERR_SOMETHING = "message"`
- Enum-like error entries in error-related objects

## Testing

```bash
npm test
```

## License

MIT
