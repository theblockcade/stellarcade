//! Shared data types for the flash tournament contract.

use soroban_sdk::{contracttype, Address, String, Vec};

/// Lifecycle of a flash lobby.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LobbyStatus {
    /// Registration window is open; fewer than 4 players have joined.
    Registering,
    /// 4 players joined; semifinals are being played.
    Semifinals,
    /// Both semifinals decided; the final is being played.
    Finals,
    /// Final winner decided and prizes are claimable.
    Completed,
    /// Registration window expired before 4 players joined; refunds owed.
    Cancelled,
}

/// One semifinal or final matchup within a lobby's 2-round bracket.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FlashMatch {
    pub player_a: Address,
    pub player_b: Address,
    pub winner: Option<Address>,
}

/// A single 4-player flash tournament lobby.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FlashLobby {
    pub lobby_id: u64,
    pub host: Address,
    pub entry_fee: u128,
    pub game_type: String,
    pub status: LobbyStatus,
    pub players: Vec<Address>,
    /// Registration deadline: `created_at + REGISTRATION_WINDOW_SECS`.
    pub registration_deadline: u64,
    /// Semifinal matches (index 0 and 1), populated once 4 players join.
    pub semifinals: Vec<FlashMatch>,
    /// Final match between the two semifinal winners. Empty until both
    /// semifinals are decided, then holds exactly one `FlashMatch`.
    /// (`Vec` instead of `Option<FlashMatch>` because Soroban's XDR
    /// conversion does not support `Option<CustomStruct>` fields.)
    pub finals: Vec<FlashMatch>,
    /// Champion once the final is decided.
    pub champion: Option<Address>,
    /// Runner-up (final match loser) once the final is decided.
    pub runner_up: Option<Address>,
    /// True once prize claims have been paid out (tracked per-player).
    pub claimed: Vec<Address>,
    /// True once refunds have been paid out (tracked per-player), only
    /// relevant when `status == Cancelled`.
    pub refunded: Vec<Address>,
}

/// Read-only external summary of a flash lobby.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FlashLobbySummary {
    pub lobby_id: u64,
    pub host: Address,
    pub entry_fee: u128,
    pub game_type: String,
    pub status: LobbyStatus,
    pub players: Vec<Address>,
    pub registration_deadline: u64,
    pub semifinals: Vec<FlashMatch>,
    pub finals: Vec<FlashMatch>,
    pub champion: Option<Address>,
    pub runner_up: Option<Address>,
}
