use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CrateAvailabilityState {
    Missing,
    Available,
    SoldOut,
    Paused,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CrateData {
    pub crate_id: u64,
    pub total_supply: u32,
    pub minted_supply: u32,
    pub paused: bool,
    pub common_count: u32,
    pub rare_count: u32,
    pub epic_count: u32,
    pub legendary_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CrateAvailabilitySnapshot {
    pub crate_id: u64,
    pub exists: bool,
    pub state: CrateAvailabilityState,
    pub total_supply: u32,
    pub minted_supply: u32,
    pub remaining_supply: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RarityDistributionSnapshot {
    pub crate_id: u64,
    pub exists: bool,
    pub configured: bool,
    pub common_bps: u32,
    pub rare_bps: u32,
    pub epic_bps: u32,
    pub legendary_bps: u32,
}
