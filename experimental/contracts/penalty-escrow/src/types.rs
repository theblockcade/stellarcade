use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BondStatus {
    Active,
    Disputed,
    Released,
    Slashed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerBond {
    pub match_id: u64,
    pub player: Address,
    pub amount: u128,
    pub status: BondStatus,
    pub dispute_id: Option<u64>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeRecord {
    pub dispute_id: u64,
    pub match_id: u64,
    pub reporter: Address,
    pub evidence_hash: BytesN<32>,
    pub resolved: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BondSummary {
    pub match_id: u64,
    pub player: Address,
    pub amount: u128,
    pub status: BondStatus,
    pub is_disputed: bool,
}
