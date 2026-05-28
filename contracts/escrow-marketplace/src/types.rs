use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowLifecycleState {
    Locked,
    Released,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowViewState {
    Missing,
    Locked,
    Releasable,
    Released,
    Expired,
    Disputed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowRecord {
    pub escrow_id: u64,
    pub buyer: Address,
    pub seller: Address,
    pub amount: i128,
    pub expiry: u64,
    pub dispute_open: bool,
    pub status: EscrowLifecycleState,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowStatusSnapshot {
    pub escrow_id: u64,
    pub exists: bool,
    pub state: EscrowViewState,
    pub buyer: Option<Address>,
    pub seller: Option<Address>,
    pub expiry: Option<u64>,
    pub dispute_open: bool,
    pub now: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReleaseReadiness {
    pub escrow_id: u64,
    pub exists: bool,
    pub ready: bool,
    pub state: EscrowViewState,
    pub blocker: Option<String>,
    pub now: u64,
    pub expires_at: Option<u64>,
    pub dispute_open: bool,
}
