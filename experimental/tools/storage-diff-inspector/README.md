# Storage Diff Inspector

A CLI tool that compares two snapshots of a Soroban contract's storage
entries, identifies added, modified, and deleted keys, and outputs a
formatted, color-coded diff.

## Usage

```bash
# Two live ledgers of a deployed contract (falls back to a bundled demo
# dataset if no Soroban RPC is reachable in this environment):
npx tsx src/index.ts --contract-id <id> --before-ledger <n> --after-ledger <m>

# Two saved JSON snapshot files:
npx tsx src/index.ts --before-file before.json --after-file after.json

# Write a report to disk instead of stdout:
npx tsx src/index.ts --before-file before.json --after-file after.json \
  --format markdown --out report.md
```

`--format` accepts `ansi` (default, for `--out` — terminal output is always
ANSI-colored), `markdown`, or `html`.

A snapshot file is a JSON array of entries:

```json
[
  { "key": { "symbol": "TotalPool" }, "value": { "u64": 50000000000 }, "durability": "instance" },
  { "key": { "address": "GBXWW2..." }, "value": { "balance": 10000, "rank": "Silver" }, "durability": "persistent" }
]
```

## Example output

Given a `before` and `after` snapshot where `TotalPool` and a player's
balance/rank changed, and a new player entry was added:

```
1 added, 2 modified, 0 removed

+ GBXWW2ZJ6Z4EXAMPLE2 [persistent] = {"balance":5000,"rank":"Bronze"} (map/struct)
~ GBXWW2ZJ6Z4EXAMPLE1 [persistent] {"balance":10000,"rank":"Silver"} -> {"balance":12500,"rank":"Gold"}
~ TotalPool [instance] 50000000000 -> 52500000000
```

(In a real terminal, `+` lines render green, `~` lines render yellow with a
red→green before/after split, and durability tags render dimmed.)

Two identical snapshots produce:

```
No storage changes detected
```

A `--format markdown` report for the same diff:

```markdown
**1 added, 2 modified, 0 removed**

| Change | Key | Durability | Before | After |
|---|---|---|---|---|
| ➕ Added | `GBXWW2ZJ6Z4EXAMPLE2` | persistent | — | {"balance":5000,"rank":"Bronze"} |
| ✏️ Modified | `GBXWW2ZJ6Z4EXAMPLE1` | persistent | {"balance":10000,"rank":"Silver"} | {"balance":12500,"rank":"Gold"} |
| ✏️ Modified | `TotalPool` | instance | 50000000000 | 52500000000 |
```

`--format html` produces a minimal, self-contained HTML page with the same
data in a color-coded table.

## Decoding

SCVal-shaped keys/values (`{ symbol: ... }`, `{ u64: ... }`, `{ address:
... }`, etc.) are decoded into readable JSON primitives/strings — the same
simplified, JSON-shaped decoding convention used by the sibling
`state-snapshot-dumper` tool, since these experimental tools work against
JSON snapshot files rather than real Horizon/RPC XDR binaries.

## Testing

```bash
npm install
npm test
```
