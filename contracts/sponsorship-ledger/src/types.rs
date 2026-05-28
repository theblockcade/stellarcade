use soroban_sdk::{contracttype, Address, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PartnerCommitment {
    pub partner: Address,
    pub total_amount: i128,
    pub released_amount: i128,
    pub remaining_amount: i128,
    pub last_release_time: u64,
    pub is_active: bool,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Release {
    pub timestamp: u64,
    pub amount: i128,
    pub is_processed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReleaseSchedule {
    pub partner: Address,
    pub releases: Vec<Release>,
    pub total_scheduled: i128,
}
