use soroban_sdk::{contracttype, Address, Symbol};

/// Lifecycle stage of a bounty.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BountyStatus {
    Open,
    Paused,
    Completed,
    Cancelled,
}

/// Optional BountyStatus wrapper for use in `#[contracttype]` structs.
/// Soroban's XDR layer does not support `Option<CustomEnum>` directly.
///
/// Zero-state: `OptionalBountyStatus::None`
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum OptionalBountyStatus {
    None,
    Some(BountyStatus),
}

/// Persistent storage record for a single bounty.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyRecord {
    pub bounty_id: u64,
    pub poster: Address,
    pub reward: i128,
    pub status: BountyStatus,
    pub expiry_ledger: u32,
    pub description: Symbol,
}

/// Full view of a single bounty returned to callers.
///
/// Zero-state fallback (when `exists` is `false`):
/// - `poster`: `None`
/// - `reward`: `None`
/// - `status`: `OptionalBountyStatus::None`
/// - `expiry_ledger`: `None`
/// - `description`: `None`
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyView {
    pub bounty_id: u64,
    pub exists: bool,
    pub poster: Option<Address>,
    pub reward: Option<i128>,
    pub status: OptionalBountyStatus,
    pub expiry_ledger: Option<u32>,
    pub description: Option<Symbol>,
}

/// Lightweight status-only view of a bounty.
///
/// Zero-state fallback (when `exists` is `false`):
/// - `status`: `OptionalBountyStatus::None`
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyStatusView {
    pub bounty_id: u64,
    pub exists: bool,
    pub status: OptionalBountyStatus,
}

/// Platform configuration view.
///
/// Zero-state fallback (when `initialized` is `false`):
/// - `admin`: `None`
/// - `token`: `None`
/// - `fee_bps`: `None`
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlatformConfigView {
    pub initialized: bool,
    pub admin: Option<Address>,
    pub token: Option<Address>,
    pub fee_bps: Option<u32>,
}

/// Aggregate statistics across all bounties.
///
/// Zero-state fallback (when no bounties exist):
/// - all counts: `0`
/// - `total_escrowed`: `0`
///
/// `total_escrowed` is the sum of `reward` for bounties with status `Open` or `Paused` only.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountySummary {
    pub open_count: u64,
    pub paused_count: u64,
    pub completed_count: u64,
    pub cancelled_count: u64,
    /// Sum of reward for Open + Paused bounties only.
    pub total_escrowed: i128,
}
