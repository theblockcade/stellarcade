# auction-house

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

### `active_lot_summary`
Returns a summary of active lots in the auction house.

```rust
pub fn active_lot_summary(env: Env) -> ActiveLotSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`ActiveLotSummary`

### `bid_window_snapshot`
Returns a snapshot of the current bid window.

```rust
pub fn bid_window_snapshot(env: Env) -> BidWindowSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`BidWindowSnapshot`

