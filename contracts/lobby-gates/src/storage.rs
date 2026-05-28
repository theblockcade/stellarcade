use soroban_sdk::{contracttype, Address, Env};

use crate::types::Gate;

#[contracttype]
pub enum DataKey {
    Gate(u64),
    /// Tracks whether a player has already entered a gate (prevents double-count).
    Entrant(u64, Address),
}

pub fn get_gate(env: &Env, id: u64) -> Option<Gate> {
    env.storage().persistent().get(&DataKey::Gate(id))
}

pub fn set_gate(env: &Env, id: u64, gate: &Gate) {
    env.storage().persistent().set(&DataKey::Gate(id), gate);
}

pub fn has_entered(env: &Env, id: u64, player: Address) -> bool {
    env.storage().persistent().has(&DataKey::Entrant(id, player))
}

pub fn mark_entered(env: &Env, id: u64, player: Address) {
    env.storage()
        .persistent()
        .set(&DataKey::Entrant(id, player), &true);
}
