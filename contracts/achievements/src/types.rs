use soroban_sdk::{contracttype, Address, Env, String, Vec};

// Types for achievements contract

#[contracttype]
pub struct Achievement {
    pub id: u32,
    pub category: String,
    pub title: String,
    pub unlocked: bool,
}

#[contracttype]
pub struct CategoryCompletionSummary {
    pub category: String,
    pub total_achievements: u32,
    pub unlocked_achievements: u32,
    pub completion_percentage: u32,
}

#[contracttype]
pub struct NextUnlock {
    pub user: Address,
    pub next_achievement: Option<Achievement>,
    pub progress: u32,
}

#[contracttype]
pub struct AchievementUnlockSnapshot {
    pub user: Address,
    pub total_achievements: u32,
    pub unlocked_achievements: u32,
    pub locked_achievements: u32,
    pub completion_percentage: u32,
}

#[contracttype]
pub struct ClaimGraceAccessor {
    pub user: Address,
    pub grace_period_ledger: u32,
    pub current_ledger: u32,
    pub is_within_grace_period: bool,
    pub ledgers_remaining: u32,
}
