# merch-redemption

## Public Reads

### `claim_window_snapshot(item_id: Symbol) -> ClaimWindowSnapshot`

Returns a structured claim-window read for a merch item.

Fallback behavior:
- Unknown or not-yet-configured `item_id` returns `configured = false`.
- Numeric fields return zero values when unconfigured.

### `stock_pressure(item_id: Symbol) -> StockPressure`

Returns stock pressure derived from tracked claim-window aggregates.

Fallback and zero-value conventions:
- Unknown or not-yet-configured `item_id` returns `configured = false`.
- `pressure_bps` is in basis points (`0..=10000`) and returns `0` for unconfigured items.
- `pressure_level = None` for unconfigured items.
