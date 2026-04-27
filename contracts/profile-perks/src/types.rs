use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PerkTier {
    pub perk_id: u32,
    pub required_points: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PerkCatalog {
    pub is_paused: bool,
    pub tiers: soroban_sdk::Vec<PerkTier>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserPerkState {
    pub user: Address,
    pub points: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActivePerkSummary {
    pub user: Address,
    pub configured: bool,
    pub paused: bool,
    pub points: u32,
    pub active_perk_id: u32,
    pub active_perk_required_points: u32,
    pub next_perk_id: u32,
    pub next_perk_required_points: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UnlockGapSnapshot {
    pub user: Address,
    pub configured: bool,
    pub paused: bool,
    pub points: u32,
    pub next_perk_id: u32,
    pub points_to_unlock: u32,
    pub all_perks_unlocked: bool,
}
