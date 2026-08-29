use soroban_sdk::{contracttype, Env, Vec};

use crate::types::{RaffleState, TicketPurchase};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextRaffleId,
    Raffle(u64),
    Purchases(u64),
}

pub fn get_next_raffle_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextRaffleId)
        .unwrap_or(1u64)
}

pub fn set_next_raffle_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextRaffleId, &id);
}

pub fn get_raffle(env: &Env, raffle_id: u64) -> Option<RaffleState> {
    env.storage().instance().get(&DataKey::Raffle(raffle_id))
}

pub fn set_raffle(env: &Env, state: &RaffleState) {
    env.storage()
        .instance()
        .set(&DataKey::Raffle(state.raffle_id), state);
}

pub fn get_purchases(env: &Env, raffle_id: u64) -> Vec<TicketPurchase> {
    env.storage()
        .instance()
        .get(&DataKey::Purchases(raffle_id))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn set_purchases(env: &Env, raffle_id: u64, purchases: &Vec<TicketPurchase>) {
    env.storage()
        .instance()
        .set(&DataKey::Purchases(raffle_id), purchases);
}
