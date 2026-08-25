use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VestingSchedule {
    pub schedule_id: u64,
    pub admin: Address,
    pub beneficiary: Address,
    pub total_amount: u128,
    pub released_amount: u128,
    pub start_ts: u64,
    pub cliff_sec: u64,
    pub duration_sec: u64,
    pub revocable: bool,
    pub revoked: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScheduleSummary {
    pub schedule_id: u64,
    pub admin: Address,
    pub beneficiary: Address,
    pub total_amount: u128,
    pub released_amount: u128,
    pub start_ts: u64,
    pub cliff_sec: u64,
    pub duration_sec: u64,
    pub revocable: bool,
    pub revoked: bool,
}
