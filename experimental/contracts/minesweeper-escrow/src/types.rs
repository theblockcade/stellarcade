//! Shared data types for the minesweeper escrow contract.

use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum GameStatus {
    Active,
    CashedOut,
    Lost,
}

/// Outcome of a single `reveal_tile` call.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TileRevealResult {
    pub is_mine: bool,
    /// Multiplier after this reveal, in basis points (10000 = 1.00x).
    pub multiplier_bps: u32,
    pub status: GameStatus,
}

/// Outcome of a `cashout` call.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CashoutResult {
    pub payout: i128,
    pub multiplier_bps: u32,
}

/// Full game state, including the committed board hash used to derive
/// mine positions and, once the round has ended, the salt needed to
/// independently re-derive and verify them.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MinesweeperSummary {
    pub id: u64,
    pub player: Address,
    pub wager_amount: i128,
    pub grid_size: u32,
    pub mine_count: u32,
    pub board_hash: BytesN<32>,
    pub tiles_revealed: u32,
    pub multiplier_bps: u32,
    pub status: GameStatus,
}
