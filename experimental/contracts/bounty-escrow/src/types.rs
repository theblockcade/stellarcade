use soroban_sdk::{Address, BytesN, Duration, Symbol};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Bounty {
    pub sponsor: Address,
    pub target_game: Symbol,
    pub target_score: i32,
    pub amount: i128,
    pub deadline: Duration,
    pub is_approved: bool,
    pub is_expired: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Claim {
    pub player: Address,
    pub bounty_id: BytesN<32>,
    pub proof_hash: BytesN<32>,
    pub is_approved: bool,
}
