# reserve-auction

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

### `set_paused`
```rust
pub fn set_paused(env: Env, paused: bool) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `paused` | `bool` |

#### Return Type

`Result<(), Error>`

### `create_auction`
```rust
pub fn create_auction(env: Env, seller: Address, asset_label: String, reserve_price: i128, start_ledger: u32, end_ledger: u32) -> Result<u64, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `seller` | `Address` |
| `asset_label` | `String` |
| `reserve_price` | `i128` |
| `start_ledger` | `u32` |
| `end_ledger` | `u32` |

#### Return Type

`Result<u64, Error>`

### `place_bid`
```rust
pub fn place_bid(env: Env, bidder: Address, auction_id: u64, amount: i128) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `bidder` | `Address` |
| `auction_id` | `u64` |
| `amount` | `i128` |

#### Return Type

`Result<(), Error>`

### `settle_auction`
```rust
pub fn settle_auction(env: Env, seller: Address, auction_id: u64) -> Result<SettlementOutcome, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `seller` | `Address` |
| `auction_id` | `u64` |

#### Return Type

`Result<SettlementOutcome, Error>`

### `auction_snapshot`
```rust
pub fn auction_snapshot(env: Env, auction_id: u64) -> ReserveAuctionSnapshot
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `auction_id` | `u64` |

#### Return Type

`ReserveAuctionSnapshot`

### `seller_summary`
```rust
pub fn seller_summary(env: Env, seller: Address) -> SellerAuctionSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `seller` | `Address` |

#### Return Type

`SellerAuctionSummary`

