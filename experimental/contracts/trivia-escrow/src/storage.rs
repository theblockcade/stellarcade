//! Storage helpers for the trivia-escrow contract.

use soroban_sdk::{vec, Address, Env, Vec};

use crate::types::{DataKey, Error, PlayerCommitment, TriviaRound};

/// Persistent storage TTL in ledgers (~30 days at 5s/ledger). Bumped on every
/// write so round and player data never expire mid-round.
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

/// Mint the next round id from the instance-scoped counter, starting at 1.
pub fn next_round_id(env: &Env) -> u64 {
    let current: u64 = env
        .storage()
        .instance()
        .get(&DataKey::RoundCounter)
        .unwrap_or(0);
    let next = current + 1;
    env.storage().instance().set(&DataKey::RoundCounter, &next);
    next
}

pub fn save_round(env: &Env, round_id: u64, round: &TriviaRound) {
    let key = DataKey::Round(round_id);
    env.storage().persistent().set(&key, round);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn load_round(env: &Env, round_id: u64) -> Result<TriviaRound, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Round(round_id))
        .ok_or(Error::RoundNotFound)
}

pub fn save_commitment(env: &Env, round_id: u64, player: &Address, commitment: &PlayerCommitment) {
    let key = DataKey::Commitment(round_id, player.clone());
    env.storage().persistent().set(&key, commitment);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn load_commitment(
    env: &Env,
    round_id: u64,
    player: &Address,
) -> Result<PlayerCommitment, Error> {
    env.storage()
        .persistent()
        .get(&DataKey::Commitment(round_id, player.clone()))
        .ok_or(Error::CommitmentNotFound)
}

pub fn has_commitment(env: &Env, round_id: u64, player: &Address) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Commitment(round_id, player.clone()))
}

pub fn add_player(env: &Env, round_id: u64, player: &Address) {
    let key = DataKey::Players(round_id);
    let mut players: Vec<Address> = env
        .storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| vec![env]);
    players.push_back(player.clone());
    env.storage().persistent().set(&key, &players);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn load_players(env: &Env, round_id: u64) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::Players(round_id))
        .unwrap_or_else(|| vec![env])
}
