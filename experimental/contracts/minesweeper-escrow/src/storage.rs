//! Storage keys and access helpers for the minesweeper escrow contract.

use soroban_sdk::{contracttype, Address, Env};

use crate::types::MinesweeperSummary;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    /// Next game id to be assigned.
    NextGameId,
    Game(u64),
    /// Which (row, col) tiles have already been revealed for a game.
    RevealedTile(u64, u32, u32),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn read_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn read_next_game_id(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::NextGameId).unwrap_or(0)
}

pub fn write_next_game_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextGameId, &id);
}

pub fn read_game(env: &Env, id: u64) -> Option<MinesweeperSummary> {
    env.storage().persistent().get(&DataKey::Game(id))
}

pub fn write_game(env: &Env, id: u64, game: &MinesweeperSummary) {
    let key = DataKey::Game(id);
    env.storage().persistent().set(&key, game);
    extend(env, &key);
}

pub fn is_tile_revealed(env: &Env, game_id: u64, row: u32, col: u32) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::RevealedTile(game_id, row, col))
}

pub fn mark_tile_revealed(env: &Env, game_id: u64, row: u32, col: u32) {
    let key = DataKey::RevealedTile(game_id, row, col);
    env.storage().persistent().set(&key, &true);
    extend(env, &key);
}
