use soroban_sdk::contracttype;

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum BucketState {
    NotConfigured,
    Missing,
    Active,
    Paused,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum PlayerBucketState {
    NotConfigured,
    MissingPlayer,
    MissingBucket,
    Active,
    Paused,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum DemotionRiskLevel {
    None,
    Low,
    Medium,
    High,
    Critical,
    Blocked,
}

/// Storage-backed bucket configuration reused by the summary and risk reads.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BucketConfig {
    pub bucket_id: u32,
    pub min_streak: u32,
    pub max_streak: u32,
    pub demotion_window_secs: u64,
    pub player_count: u32,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerRecord {
    pub bucket_id: u32,
    pub current_streak: u32,
    pub last_extended_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreakBucketSummary {
    pub bucket_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub state: BucketState,
    pub min_streak: u32,
    pub max_streak: u32,
    pub demotion_window_secs: u64,
    pub player_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DemotionRisk {
    pub configured: bool,
    pub player_found: bool,
    pub bucket_found: bool,
    pub bucket_id: u32,
    pub current_streak: u32,
    pub last_extended_at: u64,
    pub demotion_at: u64,
    pub seconds_until_demotion: u64,
    pub risk_level: DemotionRiskLevel,
    pub bucket_paused: bool,
    pub would_demote_now: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerBucketSummary {
    pub configured: bool,
    pub player_found: bool,
    pub bucket_found: bool,
    pub state: PlayerBucketState,
    pub bucket_id: u32,
    pub current_streak: u32,
    pub last_extended_at: u64,
    pub min_streak: u32,
    pub max_streak: u32,
    pub demotion_window_secs: u64,
    pub bucket_player_count: u32,
}
