use soroban_sdk::{contracttype, Address, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MatchStatus {
    Pending = 0,
    Active = 1,
    Completed = 2,
    Cancelled = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Squad {
    pub id: u32,
    pub members: Vec<Address>,
    pub total_score: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchConfig {
    pub admin: Address,
    pub min_players_per_squad: u32,
    pub max_squads: u32,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchState {
    pub match_id: u32,
    pub squads: Vec<Squad>,
    pub status: MatchStatus,
    pub start_time: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchSnapshot {
    pub config: Option<MatchConfig>,
    pub match_state: Option<MatchState>,
    pub timestamp: u64,
}
