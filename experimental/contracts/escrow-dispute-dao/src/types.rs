use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum JurorVote {
    Player1Wins,
    Player2Wins,
    InvalidateRefund,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DisputeStatus {
    Open,
    Voting,
    Resolved,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Dispute {
    pub dispute_id: u64,
    pub reporter: Address,
    pub match_id: u64,
    pub escrow_amount: i128,
    pub evidence: BytesN<32>,
    pub tribunal: soroban_sdk::Vec<Address>,
    pub votes: soroban_sdk::Map<Address, JurorVote>,
    pub status: DisputeStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeSummary {
    pub dispute_id: u64,
    pub reporter: Address,
    pub match_id: u64,
    pub escrow_amount: i128,
    pub status: DisputeStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DisputeVerdict {
    pub dispute_id: u64,
    pub winner: JurorVote,
    pub resolved: bool,
}
