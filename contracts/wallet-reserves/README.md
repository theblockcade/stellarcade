# Wallet Reserves Contract

## Overview

The Wallet Reserves contract manages reserve allocations for wallets, providing real-time monitoring of reserve levels and depletion risk assessment. This contract enables administrators to allocate reserves to wallets, track usage, and receive alerts when reserves approach depletion thresholds.

## Features

- **Reserve Allocation**: Allocate reserves to specific wallets with configurable depletion thresholds
- **Depletion Risk Assessment**: Real-time risk evaluation (LOW, MEDIUM, HIGH) based on current balance vs. threshold
- **Reserve Summary**: Aggregate view of all reserve allocations across wallets
- **Pause/Unpause**: Emergency pause mechanism for administrative control
- **Flexible Updates**: Update available reserves as usage occurs

## Public Methods

### Administrative Functions

#### `init(env: Env, admin: Address) -> Result<(), Error>`
Initialize the contract with an admin address.

#### `pause(env: Env, admin: Address) -> Result<(), Error>`
Pause all contract mutations (admin only).

#### `unpause(env: Env, admin: Address) -> Result<(), Error>`
Unpause the contract (admin only).

#### `allocate_reserves(env: Env, admin: Address, wallet: Address, amount: i128, depletion_threshold: i128) -> Result<(), Error>`
Allocate reserves to a wallet with a specified depletion threshold.

#### `update_available_reserves(env: Env, admin: Address, wallet: Address, new_available: i128) -> Result<(), Error>`
Update the available reserves for a wallet (typically after usage).

### Read-Only Functions

#### `get_reserve_allocation_summary(env: Env) -> Result<ReserveAllocationSummary, Error>`
Get an aggregate summary of all reserve allocations including:
- Total allocated amount
- Total available amount
- Wallet counts by risk level

#### `get_depletion_risk_assessment(env: Env, wallet: Address) -> Result<DepletionRiskAssessment, Error>`
Get detailed risk assessment for a specific wallet including:
- Current balance
- Allocated amount
- Depletion threshold
- Risk level (LOW, MEDIUM, HIGH)
- Recommended action (NORMAL, MONITOR, URGENT)

#### `get_wallet_reserves(env: Env, wallet: Address) -> Result<ReserveAllocation, Error>`
Get the complete reserve allocation details for a wallet.

## Data Structures

### ReserveAllocation
```rust
pub struct ReserveAllocation {
    pub wallet: Address,
    pub allocated_amount: i128,
    pub available_amount: i128,
    pub depletion_threshold: i128,
    pub last_updated: u64,
}
```

### DepletionRiskAssessment
```rust
pub struct DepletionRiskAssessment {
    pub wallet: Address,
    pub current_balance: i128,
    pub allocated_amount: i128,
    pub depletion_threshold: i128,
    pub risk_level: Symbol,
    pub estimated_depletion_time: Option<u64>,
    pub recommended_action: Symbol,
}
```

## Risk Levels

- **LOW**: Available amount > 2x depletion threshold
- **MEDIUM**: Available amount between threshold and 2x threshold
- **HIGH**: Available amount ≤ depletion threshold

## Error Codes

- `NotInitialized (1)`: Contract not initialized
- `AlreadyInitialized (2)`: Contract already initialized
- `Unauthorized (3)`: Caller is not admin
- `Paused (4)`: Contract is paused
- `WalletNotFound (5)`: Wallet has no reserve allocation
- `InvalidAmount (6)`: Invalid amount or threshold
- `InsufficientReserves (7)`: Insufficient reserves for operation

## Usage Example

```rust
// Initialize contract
WalletReserves::init(env.clone(), admin.clone())?;

// Allocate reserves to a wallet
WalletReserves::allocate_reserves(
    env.clone(),
    admin.clone(),
    wallet_address,
    1000,  // allocated amount
    100    // depletion threshold
)?;

// Check depletion risk
let risk = WalletReserves::get_depletion_risk_assessment(env.clone(), wallet_address)?;
if risk.risk_level == symbol_short!("HIGH") {
    // Take action based on high risk
}

// Update available reserves after usage
WalletReserves::update_available_reserves(
    env.clone(),
    admin.clone(),
    wallet_address,
    750  // new available amount
)?;
```

## Testing

Run tests with:
```bash
cargo test
```

The contract includes comprehensive test coverage for:
- Initialization and re-initialization prevention
- Reserve allocation and updates
- Risk assessment at different levels
- Empty state handling
- Paused state behavior
- Authorization enforcement
- Invalid input handling
