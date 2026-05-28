# merch-redemption

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |

#### Return Type

`Result<(), Error>`

### `claim_window_snapshot`
Returns a structured claim-window snapshot for one merch item.  Empty/missing behavior: - Unknown or not-yet-configured `item_id` returns `configured = false` and zero-value fields.

```rust
pub fn claim_window_snapshot(env: Env, item_id: Symbol) -> ClaimWindowSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `item_id` | `Symbol` |

#### Return Type

`ClaimWindowSnapshot`

### `stock_pressure`
Returns stock pressure for one merch item using tracked claim-window aggregates.  Zero-value conventions: - Unknown or not-yet-configured `item_id` returns `configured = false`, `pressure_bps = 0`, and `pressure_level = None`. - `pressure_bps` is always clamped to `0..=10000`.

```rust
pub fn stock_pressure(env: Env, item_id: Symbol) -> StockPressure
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `item_id` | `Symbol` |

#### Return Type

`StockPressure`

