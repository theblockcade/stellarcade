# @stellarcade/accounting-csv-exporter

Export StellarCade arcade game transactions to accounting-ready CSV spreadsheets.

This is an experimental CLI tool for Issue #1175. It fetches transaction history from a Soroban smart contract, classifies each transaction into accounting categories, and outputs a CSV suitable for import into spreadsheet or accounting software.

## Installation

```bash
npm install
```

## Usage

```bash
npx tsx src/index.ts \
  --contract-id CASGNJ3K6VWKQFQ7ZUIFZIY2LGYZTOOJBFHZPHVX7RFLX5UWMABZMBY2 \
  --start-date 2025-07-01 \
  --end-date 2025-07-31 \
  --out transactions.csv
```

### CLI Options

| Option | Required | Description |
|---|---|---|
| `--contract-id <id>` | Yes | Soroban contract ID to filter transactions for |
| `--start-date <YYYY-MM-DD>` | Yes | Start of date range (inclusive, UTC) |
| `--end-date <YYYY-MM-DD>` | Yes | End of date range (inclusive, UTC) |
| `--out <path>` | No | Output file path (defaults to stdout) |

## Transaction Types

| Type | Description |
|---|---|
| **Wager Inflow** | Player wager deposits into the game contract |
| **Prize Payout** | Winnings paid out to players |
| **Fee Revenue** | Platform fees collected per transaction |
| **Staking Yield** | Yield earned from staking rewards |

## Sample CSV Output

```csv
Timestamp,TX Hash,Type,Asset,Amount,Fee,Sender,Recipient
2025-07-01T12:00:00.000Z,CASGNJ3KTX0000000000000000000000000000000000000000000000,Wager Inflow,XLM,10.0000000,0.0100000,GAINVT7VBFSC6KID7MYFCN7OCZPR5WCN5V6ABH2M3G2Z5RSJLXSD7CU6,GCCD6AJOYZCUAQLX32ZVJ2CJZOB7GJ7XDYY3HASXVQDNALWFN7MGA4KG
2025-07-01T13:00:00.000Z,CASGNJ3KTX0001000000000000000000000000000000000000000000,Prize Payout,USDC,20.0000000,0.0100000,GDF4GK5TANBJD6U4EMSSVQIYIYK6WCPZC7YV27S3QZ6OB5FZU5YXRPWR,GDDSCBD4L5A7M6XXSY7AHTQ7GD3AQMNN5MFZRLRCDNT6YVVNDEFLA53S
2025-07-01T14:00:00.000Z,CASGNJ3KTX0002000000000000000000000000000000000000000000,Fee Revenue,yBTC,30.0000000,0.0100000,GCFXHS6GV2M57PBY5N6YHPA3M5AFL5LH6QYGXGJCLH5E3Z2AFGM6WQFA,GDZ5IHLF3W6SZLHV457ZSXIILHT6DKOVIKXGMPLCWVL5JXQVSS2MYW5I
```

## CSV Columns

| Column | Format | Description |
|---|---|---|
| Timestamp | ISO-8601 UTC | Transaction timestamp |
| TX Hash | String | Transaction hash on Stellar |
| Type | Enum | One of: Wager Inflow, Prize Payout, Fee Revenue, Staking Yield |
| Asset | String | Asset code (XLM, USDC, yBTC, etc.) |
| Amount | Decimal (7 places) | Transaction amount in human-readable units |
| Fee | Decimal (7 places) | Transaction fee in human-readable units |
| Sender | Stellar address | Sender public key |
| Recipient | Stellar address | Recipient public key |

## Running Tests

```bash
npm test
```

## Architecture

```
src/
  index.ts            # CLI entry point (commander)
  tx-fetcher.ts       # Transaction fetching & mock data generation
  csv-formatter.ts    # CSV formatting, escaping, and type classification
  tx-fetcher.test.ts  # Tests for transaction fetching and classification
  csv-formatter.test.ts  # Tests for CSV escaping and column formatting
```

## Notes

- Amounts are converted from stroops (1 XLM = 10,000,000 stroops) to decimal.
- CSV output follows RFC 4180 escaping rules.
- The current implementation uses mock transaction data. Future versions will connect to Horizon/Soroban RPC for real on-chain data.
