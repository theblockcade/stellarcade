use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StreakPhase {
    /// At least one flip has been resolved and no loss has ended the streak.
    Active,
    /// The player cashed out; `current_value` was paid at that point.
    CashedOut,
    /// A wrong guess ended the streak with zero payout.
    Lost,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreakState {
    pub streak_id: u64,
    pub player: Address,
    pub wager_amount: u128,
    /// Number of consecutive wins so far (0 once lost).
    pub streak_count: u32,
    /// Amount payable if the player cashes out right now (0 once lost).
    pub current_value: u128,
    pub phase: StreakPhase,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreakSummary {
    pub streak_id: u64,
    pub player: Address,
    pub wager_amount: u128,
    pub streak_count: u32,
    pub current_value: u128,
    pub phase: StreakPhase,
    pub max_streak: u32,
}
