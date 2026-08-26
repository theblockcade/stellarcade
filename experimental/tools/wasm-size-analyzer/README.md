# @stellarcade/wasm-size-analyzer

Soroban WASM binary size analyzer with section breakdown and optimization recommendations.

## Features

- Parse and analyze WASM binary files
- Detailed section-by-section size breakdown
- Automatic detection of oversized binaries (>64KB)
- Warnings for large data segments and debug symbols
- Optimization recommendations
- JSON output mode for CI/CD integration
- Color-coded terminal output

## Installation

```bash
npm install @stellarcade/wasm-size-analyzer
```

## Usage

```bash
wasm-size-analyzer --wasm path/to/contract.wasm
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--wasm <path>` | Path to WASM binary file | (required) |
| `--json` | Output results as JSON | `false` |
| `--warn-threshold-kb <number>` | Size warning threshold in KB | `64` |
| `-V, --version` | Output the version number | |
| `-h, --help` | Display help for command | |

### Examples

Basic analysis:
```bash
wasm-size-analyzer --wasm contract.wasm
```

JSON output for CI/CD:
```bash
wasm-size-analyzer --wasm contract.wasm --json
```

Custom warning threshold:
```bash
wasm-size-analyzer --wasm contract.wasm --warn-threshold-kb 128
```

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
