//! Storage keys and access helpers for the roulette mini-contract.

use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::{Round, RoundRecord};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    MinBet,
    MaxBet,
    Bankroll,
    HouseRake,
    NextRoundId,
    Round(u64),
    History(Address),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Bankroll)
}

pub fn write_limits(env: &Env, min_bet: u128, max_bet: u128, bankroll: u128) {
    env.storage().instance().set(&DataKey::MinBet, &min_bet);
    env.storage().instance().set(&DataKey::MaxBet, &max_bet);
    env.storage().instance().set(&DataKey::Bankroll, &bankroll);
    env.storage().instance().set(&DataKey::HouseRake, &0u128);
}

pub fn read_min_bet(env: &Env) -> u128 {
    env.storage().instance().get(&DataKey::MinBet).unwrap()
}

pub fn read_max_bet(env: &Env) -> u128 {
    env.storage().instance().get(&DataKey::MaxBet).unwrap()
}

pub fn read_bankroll(env: &Env) -> u128 {
    env.storage().instance().get(&DataKey::Bankroll).unwrap()
}

pub fn write_bankroll(env: &Env, bankroll: u128) {
    env.storage().instance().set(&DataKey::Bankroll, &bankroll);
}

pub fn read_house_rake(env: &Env) -> u128 {
    env.storage().instance().get(&DataKey::HouseRake).unwrap_or(0)
}

pub fn write_house_rake(env: &Env, rake: u128) {
    env.storage().instance().set(&DataKey::HouseRake, &rake);
}

pub fn next_round_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextRoundId)
        .unwrap_or(0);
    env.storage()
        .instance()
        .set(&DataKey::NextRoundId, &(id + 1));
    id
}

pub fn read_round(env: &Env, id: u64) -> Option<Round> {
    env.storage().persistent().get(&DataKey::Round(id))
}

pub fn write_round(env: &Env, round: &Round) {
    let key = DataKey::Round(round.id);
    env.storage().persistent().set(&key, round);
    extend(env, &key);
}

pub fn read_history(env: &Env, player: &Address) -> Vec<RoundRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::History(player.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn write_history(env: &Env, player: &Address, history: &Vec<RoundRecord>) {
    let key = DataKey::History(player.clone());
    env.storage().persistent().set(&key, history);
    extend(env, &key);
}
