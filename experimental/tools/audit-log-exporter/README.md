# audit-log-exporter

CLI tool to filter and export database audit log records into CSV or JSON
compliance packages, with optional AES-256-GCM encryption and a SHA-256
integrity manifest.

## Usage

```bash
npm install
npm run build

audit-log-exporter \
  --input audit-records.json \
  --format csv \
  --actor alice \
  --start 2024-01-01 \
  --end 2024-01-31 \
  --encrypt "a-strong-password" \
  --out export.csv.enc
```

`audit-records.json` is a JSON array of records, each with at least
`id`, `actor`, `action`, and an ISO-8601 `timestamp`. Extra fields are
carried through to the export.

- `--format`: `csv` or `json`.
- `--actor` / `--action`: exact-match filters.
- `--start` / `--end`: inclusive ISO-8601 date range filters.
- `--encrypt <password>`: wraps the formatted export in an AES-256-GCM
  envelope (key derived via `scrypt`), written as JSON with `iv`, `authTag`,
  `salt`, and `ciphertext`.
- `--out <path>`: writes the export to a file plus a `<path>.manifest.json`
  sidecar containing the record count, format, SHA-256 checksum, and
  encryption flag. Without `--out`, the export prints to stdout and the
  manifest goes to stderr.

Filtering streams records lazily (a generator) so large logs are not fully
materialized before filtering.

## Development

```bash
npm run dev -- --input audit-records.json --format json
npm test
```
