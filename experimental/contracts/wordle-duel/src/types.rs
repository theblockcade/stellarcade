use soroban_sdk::{contracttype, Address, BytesN, Vec};

/// A 5-letter word, one ASCII byte per tile. `Symbol::to_string()` (the
/// obvious choice per the issue's interface) is only available off-WASM
/// (`#[cfg(not(target_family = "wasm"))]` in soroban-sdk) — it would compile
/// under `cargo test` but fail to build for an actual WASM contract target,
/// so BytesN<5> is used instead for real per-letter access on every target.
pub type Word = BytesN<5>;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DuelStatus {
    WaitingForOpponent,
    InProgress,
    Settled,
    Forfeited,
}

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum TileResult {
    Green,
    Yellow,
    Gray,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GuessFeedback {
    pub guess: Word,
    pub tiles: Vec<TileResult>,
    pub is_correct: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PlayerState {
    pub player: Address,
    // The word this player is DEFENDING (what their opponent must guess).
    // Stored so the contract can score the opponent's guesses live; never
    // exposed by any read-only accessor before settlement.
    pub secret_word: Word,
    pub word_hash: BytesN<32>,
    pub guesses: Vec<GuessFeedback>,
    pub has_won: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WordleDuel {
    pub duel_id: u64,
    pub wager: u128,
    pub player_a: PlayerState,
    // NOT `Option<PlayerState>`: soroban-sdk's #[contracttype] derive only
    // supports Option<T> for its own native types (Address, BytesN<N>,
    // u64, ...), not Option<CustomStruct> — it fails to compile with a
    // "ScVal: TryFrom<...>" error. `has_player_b` is the presence flag
    // instead; `player_b` is a placeholder PlayerState until they join.
    pub player_b: PlayerState,
    pub has_player_b: bool,
    // Both players call reveal_and_settle independently; the match only
    // fully settles (status flips to Settled/Forfeited and a payout is
    // computed) once BOTH have revealed. Tracked separately from `status`
    // so the first caller's reveal is recorded without ending the match
    // before the second player has had a chance to reveal too.
    pub player_a_revealed: bool,
    pub player_b_revealed: bool,
    pub status: DuelStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WordleDuelSummary {
    pub duel_id: u64,
    pub wager: u128,
    pub player_a: Address,
    pub player_b: Option<Address>,
    pub status: DuelStatus,
    pub player_a_attempts: u32,
    pub player_b_attempts: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DuelResult {
    pub duel_id: u64,
    pub winner: Option<Address>,
    pub player_a_payout: u128,
    pub player_b_payout: u128,
    pub forfeited_by: Option<Address>,
    // False when this reveal was recorded but the match isn't settled yet
    // (the other player hasn't revealed). Payout fields are 0 and winner is
    // None in that case — the real result only exists once `is_final` is
    // true, whether that's a normal settlement or an early forfeit.
    pub is_final: bool,
}

pub const MAX_ATTEMPTS: u32 = 6;
pub const WORD_LENGTH: usize = 5;
