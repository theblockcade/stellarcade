use soroban_sdk::{contracttype, Address, Symbol, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalRecord {
    pub proposal_id: u64,
    pub proposer: Address,
    pub recipient: Address,
    pub amount: u128,
    pub memo: Symbol,
    pub confirmations: Vec<Address>,
    pub created_at: u64,
    pub executed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalSummary {
    pub proposal_id: u64,
    pub proposer: Address,
    pub recipient: Address,
    pub amount: u128,
    pub memo: Symbol,
    pub confirmations_count: u32,
    pub threshold: u32,
    pub created_at: u64,
    pub timelock_sec: u64,
    pub executed: bool,
}
