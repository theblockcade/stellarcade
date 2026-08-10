use soroban_sdk::{contracttype, Address, Env};

use crate::types::GateRecord;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Gate(u32),
    GlobalPaused,
}

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_gate(env: &Env, record: &GateRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Gate(record.gate_id), record);
}

pub fn get_gate(env: &Env, gate_id: u32) -> Option<GateRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Gate(gate_id))
        .unwrap_or(None)
}

pub fn set_global_paused(env: &Env, paused: bool) {
    env.storage()
        .instance()
        .set(&DataKey::GlobalPaused, &paused);
}

pub fn get_global_paused(env: &Env) -> bool {
    env.storage()
        .instance()
        .get(&DataKey::GlobalPaused)
        .unwrap_or(false)
}
