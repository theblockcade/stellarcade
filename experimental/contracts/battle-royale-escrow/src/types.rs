use soroban_sdk::{contracttype, Address, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MatchStatus {
    Lobby,
    InProgress,
    Finalized,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PrizeSplit {
    pub first_bps: u32,
    pub second_bps: u32,
    pub third_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BattleRoyaleMatch {
    pub match_id: u64,
    pub host: Address,
    pub entry_fee: u128,
    pub max_players: u32,
    pub min_players: u32,
    pub prize_split: PrizeSplit,
    pub players: Vec<Address>,
    pub eliminated: Vec<Address>,
    pub status: MatchStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BattleRoyaleResult {
    pub match_id: u64,
    pub first_place: Address,
    pub second_place: Address,
    pub third_place: Address,
    pub first_prize: u128,
    pub second_prize: u128,
    pub third_prize: u128,
}
