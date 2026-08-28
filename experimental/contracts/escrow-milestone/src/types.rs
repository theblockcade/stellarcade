use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Milestone {
    pub description: String,
    pub basis_points: u32, // e.g. 3300 = 33%
    pub status: MilestoneStatus,
    pub proof_hash: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowState {
    Active,
    Disputed,
    Resolved,
    Completed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowSummary {
    pub id: u64,
    pub client: Address,
    pub contractor: Address,
    pub arbiter: Address,
    pub total_amount: u128,
    pub amount_released: u128,
    pub state: EscrowState,
    pub milestones: Vec<Milestone>,
}
