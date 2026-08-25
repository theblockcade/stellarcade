# Storage Rent Estimator CLI

A Node.js/TypeScript CLI utility that analyzes Soroban contract storage entries
(Instance, Persistent, Temporary), estimates their serialized XDR byte footprint,
and projects state rent (TTL extension) costs.

## Features

- **Durability-Aware Analysis**: Counts and sizes Instance, Persistent, and Temporary storage entries separately
- **XDR Footprint Estimation**: Approximates serialized size for common ScVal shapes (integers, strings, addresses, vectors, maps)
- **Rent Cost Projection**: Estimated monthly and annual rent in stroops and XLM
- **Terminal + Markdown Output**: Human-readable terminal tables, or a `--output` markdown report file
- **Graceful Empty State**: Contracts with no storage entries produce a valid all-zero report instead of erroring

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
node dist/index.js analyze [options]
```

**Options:**
- `--contract-id <id>` (required): Soroban contract ID to analyze
- `--rpc-url <url>`: Soroban RPC URL (default: `https://soroban-testnet.stellar.org`)
- `--target-ttl-ledgers <n>`: Target TTL extension window, in ledgers (default: `535680`, ~31 days at 5s/ledger)
- `--output <path>`: Also write a markdown report to this path
- `--entries-file <path>`: Load storage entries from a local JSON file instead of fetching from the network
- `--json`: Output raw JSON instead of a formatted report

### Examples

```bash
# Analyze using a locally exported entries file
node dist/index.js analyze \
  --contract-id CA3D5KRYM6CB7OWQ6TWYRR3Z4T7VNZTRJAALQSKS7VDCERKVMO6A4RYT \
  --entries-file ./sample-entries.json \
  --target-ttl-ledgers 100000

# Write a markdown report alongside terminal output
node dist/index.js analyze \
  --contract-id CA3D5... \
  --entries-file ./sample-entries.json \
  --output ./rent-report.md
```

### Entries File Format

```json
[
  { "key": "admin", "durability": "instance", "sizeBytes": 40 },
  { "key": "balance:GABC...", "durability": "persistent", "sizeBytes": 96 },
  { "key": "nonce:GABC...", "durability": "temporary", "sizeBytes": 24 }
]
```

### Testing

```bash
npm test
```

## Rent Model

- **Persistent / Instance entries** accrue ongoing archival rent proportional to
  `sizeBytes * feePerByteLedgerPersistent * ledgers`, and are included in the
  monthly/annual rent projections.
- **Temporary entries** do not accrue long-term archival rent in Soroban — they
  simply expire once their TTL lapses — so they are excluded from the
  monthly/annual projections but still incur the one-time base write fee.
- All fee constants live in `DEFAULT_RENT_PARAMS` (`src/cost-model.ts`) and are
  approximations of Soroban's `ConfigSettingContractLedgerCostV0` / state
  archival parameters; override them via the exported `NetworkRentParams` type
  if you need to match a specific network's live fee schedule.

## Known Limitations / Follow-ups

- `fetchStorageEntries` (used when `--entries-file` is omitted) does not yet call
  the real Soroban RPC `getLedgerEntries` endpoint — this tool was authored and
  reviewed without live RPC/network access available in this environment. It
  currently logs a warning and returns an empty entry set so the report still
  renders correctly. Use `--entries-file` with entries exported via `stellar
  contract` CLI / RPC in the meantime; wiring up the live fetch is a natural
  follow-up once network access is available to validate against.
- XDR size estimation (`src/analyzer.ts`) approximates common ScVal shapes
  (ints, strings, addresses, vecs, maps) with fixed per-type overhead rather
  than byte-exact XDR encoding, which is sufficient for footprint *estimation*
  but will not match `stellar-xdr` output bit-for-bit.
- `npm install` / `npm run build` / `npm test` have not been executed in this
  environment (no local Node/npm sandbox access); please run the test suite in
  CI before merging.

## License

MIT
