# ticket-market

## Public Methods

### `init`
```rust
pub fn init(env: Env, admin: Address, token: Address) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `admin` | `Address` |
| `token` | `Address` |

#### Return Type

`Result<(), Error>`

### `list_ticket`
Post a new ticket listing. `expires_at_ledger` must be strictly greater than the current ledger.

```rust
pub fn list_ticket(env: Env, seller: Address, game_id: Symbol, price: i128, expires_at_ledger: u32) -> Result<u64, Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `seller` | `Address` |
| `game_id` | `Symbol` |
| `price` | `i128` |
| `expires_at_ledger` | `u32` |

#### Return Type

`Result<u64, Error>`

### `cancel_listing`
Cancel a listing (seller only).

```rust
pub fn cancel_listing(env: Env, seller: Address, listing_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `seller` | `Address` |
| `listing_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `fill_listing`
Mark a listing as sold (admin-only — called after successful payment).

```rust
pub fn fill_listing(env: Env, listing_id: u64) -> Result<(), Error>
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `listing_id` | `u64` |

#### Return Type

`Result<(), Error>`

### `orderbook_summary`
Returns a live summary of the orderbook, including best/worst ask and total volume across all non-expired active listings.

```rust
pub fn orderbook_summary(env: Env) -> OrderbookSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |

#### Return Type

`OrderbookSummary`

### `listing_expiry`
Returns expiry details for a single listing. Returns a not-found struct when the listing_id is unknown.

```rust
pub fn listing_expiry(env: Env, listing_id: u64) -> ListingExpiry
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `listing_id` | `u64` |

#### Return Type

`ListingExpiry`

### `listing_depth_summary`
Returns active listing depth for one game identifier.  Empty depth is represented with zero counts and prices so consumers do not need to special-case missing state.

```rust
pub fn listing_depth_summary(env: Env, game_id: Symbol) -> ListingDepthSummary
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `game_id` | `Symbol` |

#### Return Type

`ListingDepthSummary`

### `purchase_eligibility`
Returns whether a buyer can purchase a listing under the current storage-backed status and expiry rules.  Unknown listings return `exists = false`, `can_purchase = false`, and a `ListingMissing` reason. Expired listings remain readable and report `ListingExpired` without mutating their stored status.

```rust
pub fn purchase_eligibility(env: Env, listing_id: u64, buyer: Address) -> PurchaseEligibility
```

#### Parameters

| Name | Type |
|------|------|
| `env` | `Env` |
| `listing_id` | `u64` |
| `buyer` | `Address` |

#### Return Type

`PurchaseEligibility`

