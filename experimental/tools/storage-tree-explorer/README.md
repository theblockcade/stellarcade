# @stellarcade/storage-tree-explorer

Soroban contract storage key tree explorer — connects to a Soroban RPC endpoint, fetches a contract's ledger storage entries, and renders an interactive expandable ASCII/Unicode tree grouped by durability (Instance, Persistent, Temporary).

## Features

- Decodes SCVal storage keys (Symbol, Vec, Map, Address, and numeric types) into readable labels
- Groups entries into Instance / Persistent / Temporary branches
- Byte-size annotation per node, with KB formatting for larger entries
- `--expand-depth` to cap how deep the tree renders
- `--json` export mode for scripting/CI consumption
- Clean "not found" error message when the contract ID doesn't resolve

## Installation

```bash
npm install @stellarcade/storage-tree-explorer
```

## Usage

```bash
storage-tree-explorer --contract-id CABC...XYZ
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--contract-id <id>` | Contract ID (C...) to inspect | (required) |
| `--rpc-url <url>` | Soroban RPC endpoint | `https://soroban-testnet.stellar.org` |
| `--expand-depth <n>` | Maximum tree depth to render | `3` |
| `--json` | Output the raw entry list as JSON | `false` |
| `-V, --version` | Output the version number | |
| `-h, --help` | Display help for command | |

### Sample tree diagram

```
CABC...XYZ (152 B)
└── Instance (1)
    └── Symbol(Admin) (40 B)
└── Persistent (2)
    ├── Map{owner: Address(GABC...)} (80 B)
    └── Symbol(Total) (32 B)
```

### Examples

Basic inspection:
```bash
storage-tree-explorer --contract-id CABC...XYZ
```

JSON export for tooling:
```bash
storage-tree-explorer --contract-id CABC...XYZ --json > storage.json
```

Against a custom RPC endpoint with a deeper tree:
```bash
storage-tree-explorer --contract-id CABC...XYZ --rpc-url https://my-rpc.example --expand-depth 5
```

## Scope note

The RPC's `getLedgerEntries` requires exact keys, and there is no "list all
keys for a contract" call — so this first iteration fully enumerates
`instance` storage (always reachable via the contract's footprint key, which
holds its instance storage map) and lays the plumbing (`fetchStorageEntries`
in `src/index.ts`) for `persistent`/`temporary` key enumeration to be wired
in once a source of known keys (e.g. an event-catalog-driven key list) is
available.

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
