use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ArenaSessionState {
    Missing,
    Active,
    Completed,
    Expired,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ArenaSession {
    pub session_id: u64,
    pub player: Address,
    pub arena_id: u32,
    pub stake_amount: i128,
    pub started_at_ledger: u32,
    pub expires_at_ledger: u32,
    pub completed_at_ledger: Option<u32>,
    pub state: ArenaSessionState,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerSessionStats {
    pub total_started: u32,
    pub completed_count: u32,
    pub expired_count: u32,
    pub total_staked: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ArenaSessionView {
    pub session_id: u64,
    pub exists: bool,
    pub paused: bool,
    pub player: Option<Address>,
    pub arena_id: u32,
    pub stake_amount: i128,
    pub started_at_ledger: u32,
    pub expires_at_ledger: u32,
    pub completed_at_ledger: Option<u32>,
    pub state: ArenaSessionState,
    pub can_complete: bool,
    pub can_expire: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerArenaSessionSummary {
    pub player: Address,
    pub exists: bool,
    pub paused: bool,
    pub active_session_id: Option<u64>,
    pub total_started: u32,
    pub completed_count: u32,
    pub expired_count: u32,
    pub total_staked: i128,
    pub next_session_id: u64,
}
