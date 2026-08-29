use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum AchievementTier {
    Bronze,
    Silver,
    Gold,
    Neon,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Avatar {
    pub token_id: u64,
    pub owner: Address,
    pub level: u32,
    pub wins: u32,
    pub tier: AchievementTier,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AvatarTraitsSummary {
    pub token_id: u64,
    pub level: u32,
    pub wins: u32,
    pub tier: AchievementTier,
}
