//! Storage keys and access helpers for the trivia duel contract.

use soroban_sdk::{contracttype, Address, Env};

use crate::types::{AnswerCommit, Duel, DuelSettlement};

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    FeeBps,
    NextDuelId,
    Duel(u64),
    /// A player's answer commitment for (duel, round).
    Commit(u64, u32, Address),
    /// Admin-recorded correct answer for (duel, round).
    CorrectAnswer(u64, u32),
    Settlement(u64),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn write_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn read_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn write_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn read_fee_bps(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::FeeBps).unwrap_or(0)
}

pub fn write_fee_bps(env: &Env, fee_bps: u32) {
    env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
}

pub fn next_duel_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextDuelId)
        .unwrap_or(0);
    env.storage()
        .instance()
        .set(&DataKey::NextDuelId, &(id + 1));
    id
}

pub fn read_duel(env: &Env, duel_id: u64) -> Option<Duel> {
    env.storage().persistent().get(&DataKey::Duel(duel_id))
}

pub fn write_duel(env: &Env, duel: &Duel) {
    let key = DataKey::Duel(duel.id);
    env.storage().persistent().set(&key, duel);
    extend(env, &key);
}

pub fn read_commit(
    env: &Env,
    duel_id: u64,
    round_idx: u32,
    player: &Address,
) -> Option<AnswerCommit> {
    env.storage()
        .persistent()
        .get(&DataKey::Commit(duel_id, round_idx, player.clone()))
}

pub fn write_commit(
    env: &Env,
    duel_id: u64,
    round_idx: u32,
    player: &Address,
    commit: &AnswerCommit,
) {
    let key = DataKey::Commit(duel_id, round_idx, player.clone());
    env.storage().persistent().set(&key, commit);
    extend(env, &key);
}

pub fn read_correct_answer(env: &Env, duel_id: u64, round_idx: u32) -> Option<u32> {
    env.storage()
        .persistent()
        .get(&DataKey::CorrectAnswer(duel_id, round_idx))
}

pub fn write_correct_answer(env: &Env, duel_id: u64, round_idx: u32, correct_val: u32) {
    let key = DataKey::CorrectAnswer(duel_id, round_idx);
    env.storage().persistent().set(&key, &correct_val);
    extend(env, &key);
}

pub fn read_settlement(env: &Env, duel_id: u64) -> Option<DuelSettlement> {
    env.storage()
        .persistent()
        .get(&DataKey::Settlement(duel_id))
}

pub fn write_settlement(env: &Env, settlement: &DuelSettlement) {
    let key = DataKey::Settlement(settlement.duel_id);
    env.storage().persistent().set(&key, settlement);
    extend(env, &key);
}
