use soroban_sdk::{contracttype, Address, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReadyCheckSummary {
    pub total_players: u32,
    pub ready_players: u32,
    pub is_everyone_ready: bool,
    pub pending_players: Vec<Address>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SeatAvailability {
    pub total_seats: u32,
    pub occupied_seats: u32,
    pub remaining_seats: u32,
    pub is_full: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Participant {
    pub address: Address,
    pub is_ready: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LobbyData {
    pub max_seats: u32,
    pub participants: Vec<Participant>,
}
