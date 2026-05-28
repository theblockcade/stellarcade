use soroban_sdk::{Address, contracttype};

/// Milestone progression state.
#[contracttype]
#[derive(Clone, PartialEq, Eq)]
pub enum MilestoneStatus {
    /// Not yet reached.
    NotReached = 0,
    /// Currently active/in progress.
    Active = 1,
    /// Completed and claimed.
    Completed = 2,
}

/// A single guild milestone with target and reward.
#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    /// Unique identifier for this milestone.
    pub milestone_id: u32,
    /// Progress threshold to unlock this milestone.
    pub target_progress: i128,
    /// Reward given upon completion.
    pub reward_amount: i128,
    /// Current status of this milestone.
    pub status: MilestoneStatus,
}

/// Snapshot of guild progression through milestones.
#[contracttype]
#[derive(Clone)]
pub struct MilestoneCoverageSnapshot {
    /// Guild identifier.
    pub guild_id: Address,
    /// Current total progress accumulated.
    pub current_progress: i128,
    /// Number of milestones in the sequence.
    pub total_milestones: u32,
    /// Number of completed milestones.
    pub completed_milestones: u32,
    /// Percentage progress (0-100).
    pub progress_percentage: u32,
    /// ID of the most recently completed milestone.
    pub last_completed_milestone_id: u32,
}

/// Target for next uncompleted milestone.
#[contracttype]
#[derive(Clone)]
pub struct NextMilestoneTarget {
    /// Guild identifier.
    pub guild_id: Address,
    /// Next milestone ID (0 if all completed or guild unknown).
    pub next_milestone_id: u32,
    /// Progress required to reach next milestone.
    pub target_progress: i128,
    /// Current progress.
    pub current_progress: i128,
    /// Progress remaining until next milestone.
    pub progress_remaining: i128,
    /// Reward for next milestone.
    pub next_reward_amount: i128,
    /// Whether guild has completed all milestones.
    pub all_milestones_completed: bool,
}

/// Storage key discriminants.
#[contracttype]
pub enum DataKey {
    /// Super admin address (instance storage).
    Admin,
    /// Contract state: initialized flag (instance storage).
    Initialized,
    /// Current progress for a guild (persistent).
    GuildProgress(Address),
    /// Milestone details, keyed by (guild_id, milestone_id) (persistent).
    Milestone(Address, u32),
    /// Vec<u32> of milestone_ids for a guild (persistent).
    GuildMilestones(Address),
    /// Next auto-incrementing milestone_id for a guild (persistent).
    NextMilestoneId(Address),
}

/// Error codes for contract operations.
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    GuildNotFound = 4,
    MilestoneNotFound = 5,
    InvalidProgress = 6,
    InvalidTarget = 7,
    Overflow = 8,
    UnknownGuild = 9,
}
