use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RentalStatus {
    Listed,
    Active,
    Returned,
    Defaulted,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RentalAgreement {
    pub rental_id: u64,
    pub owner: Address,
    pub token_id: u64,
    /// Rental fee per second of usage.
    pub fee_per_sec: u128,
    pub collateral: u128,
    pub max_duration_sec: u64,
    pub status: RentalStatus,
    pub tenant: Option<Address>,
    pub start_ts: u64,
    pub end_ts: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RentalSummary {
    pub rental_id: u64,
    pub owner: Address,
    pub token_id: u64,
    pub fee_per_sec: u128,
    pub collateral: u128,
    pub max_duration_sec: u64,
    pub status: RentalStatus,
    pub tenant: Option<Address>,
    pub start_ts: u64,
    pub end_ts: u64,
}
