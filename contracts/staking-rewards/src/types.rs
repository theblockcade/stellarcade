use soroban_sdk::{contracttype, Address};

/// State for a single reward epoch.
///
/// An epoch is a time-bounded reward period. At epoch start the admin deposits
/// `total_rewards` tokens. Rewards accrue proportionally to each staker's
/// share of `total_staked_snapshot`. After the epoch ends stakers can claim
/// their share.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EpochState {
    /// Monotonically increasing epoch identifier (0-based).
    pub epoch_id: u64,
    /// Ledger timestamp when the epoch started.
    pub start_timestamp: u64,
    /// Ledger timestamp when the epoch ends. `0` means indefinite.
    pub end_timestamp: u64,
    /// Total reward tokens deposited for this epoch.
    pub total_rewards: i128,
    /// Total staked tokens snapshotted at epoch start.
    /// Used as the divisor for proportional reward calculation.
    pub total_staked_snapshot: i128,
    /// Cumulative tokens actually distributed (claimed) in this epoch.
    pub distributed_rewards: i128,
    /// Whether the epoch is still accepting claims.
    pub is_active: bool,
}

/// Per-staker position within the contract.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StakerPosition {
    pub address: Address,
    /// Tokens currently staked.
    pub staked_amount: i128,
    /// The epoch id in which this position was last updated.
    pub last_epoch_id: u64,
    /// Accumulated rewards claimed so far (all-time).
    pub total_claimed: i128,
}

/// Reward projection for a staker in the current epoch.
///
/// All values are deterministic and safe for frontend polling.
/// Returns zeroed values when no epoch has been started yet.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RewardProjection {
    /// Epoch this projection applies to.
    pub epoch_id: u64,
    /// Staker's current staked amount.
    pub staked_amount: i128,
    /// Projected reward share based on stake fraction and epoch rewards.
    /// Zero when `total_staked_snapshot` is zero.
    pub projected_reward: i128,
    /// Rewards already claimed in previous epochs (all-time total).
    pub total_claimed: i128,
    /// Combined view: `projected_reward + total_claimed`.
    pub lifetime_projected_total: i128,
}

/// Summary of the current epoch's accounting state.
///
/// Returns zeroed/default values when no epoch has started yet.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EpochSummary {
    /// Epoch identifier. `0` when no epoch has started.
    pub epoch_id: u64,
    /// Total rewards allocated to this epoch.
    pub total_rewards: i128,
    /// Tokens already distributed (claimed) in this epoch.
    pub distributed_rewards: i128,
    /// Remaining undistributed rewards (`total_rewards - distributed_rewards`).
    pub pending_carry_over: i128,
    /// Total tokens staked at epoch start.
    pub total_staked_snapshot: i128,
    /// Whether the epoch is still active.
    pub is_active: bool,
}
