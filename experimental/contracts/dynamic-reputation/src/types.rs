use soroban_sdk::{contracttype, Address, String};

pub const MIN_SCORE: i32 = -1000;
pub const MAX_SCORE: i32 = 1000;
pub const VOUCH_THRESHOLD: i32 = 200;
pub const DECAY_HALF_LIFE_SEC: u64 = 86400 * 30; // 30 days

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationSummary {
    pub player: Address,
    pub raw_score: i32,
    pub decayed_score: i32,
    pub last_updated_at: u64,
    pub total_ratings_count: u32,
    pub vouches_received: u32,
    pub tier: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RatingEvent {
    pub game_contract: Address,
    pub score_delta: i32,
    pub reason: String,
    pub timestamp: u64,
}
