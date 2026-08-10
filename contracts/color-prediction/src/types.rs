use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ConfigView {
    pub initialized: bool,
    pub admin: Option<Address>,
    pub rng_contract: Option<Address>,
    pub prize_pool_contract: Option<Address>,
    pub balance_contract: Option<Address>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PredictionView {
    pub exists: bool,
    pub game_id: u64,
    pub player: Address,
    pub color: u32,
    pub wager: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GameSummary {
    pub game_id: u64,
    pub exists: bool,
    pub resolved: bool,
    pub total_pot: i128,
    pub player_count: u32,
    pub winner_count: u32,
    pub winning_color: u32,
}
