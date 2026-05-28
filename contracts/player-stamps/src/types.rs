use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StampClaimState {
    NotConfigured,
    Unknown,
    Paused,
    InProgress,
    Claimable,
    Claimed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StampProgressSummary {
    pub player: Address,
    pub campaign_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub required_stamps: u32,
    pub earned_stamps: u32,
    pub remaining_stamps: u32,
    pub completed: bool,
    pub claimed: bool,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimWindowAccessor {
    pub player: Address,
    pub campaign_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub state: StampClaimState,
    pub claimable_after: u64,
    pub now: u64,
    pub seconds_until_claimable: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StampCampaign {
    pub required_stamps: u32,
    pub claimable_after: u64,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerStampProgress {
    pub earned_stamps: u32,
    pub claimed: bool,
}
