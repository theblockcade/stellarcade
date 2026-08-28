use soroban_sdk::{contracttype, Env};

use crate::types::{VaultGlobalStats, VaultPosition};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextPositionId,
    Position(u64),
    Stats,
}

pub fn get_next_position_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextPositionId)
        .unwrap_or(1u64)
}

pub fn set_next_position_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextPositionId, &id);
}

pub fn get_position(env: &Env, position_id: u64) -> Option<VaultPosition> {
    env.storage()
        .instance()
        .get(&DataKey::Position(position_id))
}

pub fn set_position(env: &Env, position: &VaultPosition) {
    env.storage()
        .instance()
        .set(&DataKey::Position(position.position_id), position);
}

pub fn get_stats(env: &Env) -> VaultGlobalStats {
    env.storage()
        .instance()
        .get(&DataKey::Stats)
        .unwrap_or(VaultGlobalStats {
            total_positions: 0,
            active_positions: 0,
            total_deposited: 0,
            total_withdrawn: 0,
            total_penalties_collected: 0,
        })
}

pub fn set_stats(env: &Env, stats: &VaultGlobalStats) {
    env.storage().instance().set(&DataKey::Stats, stats);
}
