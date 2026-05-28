use crate::types::{QueueEntry, RedeemerConfig, ScanWindow};
use soroban_sdk::{contracttype, Env, Vec};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    NextTicketId,
    AllIds,
    QueueEntry(u64),
    ScanWindow,
}

pub const BUMP_AMOUNT: u32 = 518_400;
pub const LIFETIME_THRESHOLD: u32 = 259_200;

pub fn get_config(env: &Env) -> Option<RedeemerConfig> {
    env.storage().instance().get(&DataKey::Config)
}

pub fn set_config(env: &Env, config: &RedeemerConfig) {
    env.storage().instance().set(&DataKey::Config, config);
}

pub fn get_next_ticket_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextTicketId)
        .unwrap_or(0)
}

pub fn set_next_ticket_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextTicketId, &id);
}

pub fn get_all_ids(env: &Env) -> Vec<u64> {
    env.storage()
        .instance()
        .get(&DataKey::AllIds)
        .unwrap_or(Vec::new(env))
}

pub fn push_ticket_id(env: &Env, id: u64) {
    let mut ids = get_all_ids(env);
    ids.push_back(id);
    env.storage().instance().set(&DataKey::AllIds, &ids);
}

pub fn get_queue_entry(env: &Env, ticket_id: u64) -> Option<QueueEntry> {
    let key = DataKey::QueueEntry(ticket_id);
    env.storage().persistent().get(&key)
}

pub fn set_queue_entry(env: &Env, entry: &QueueEntry) {
    let key = DataKey::QueueEntry(entry.ticket_id);
    env.storage().persistent().set(&key, entry);
    env.storage()
        .persistent()
        .extend_ttl(&key, LIFETIME_THRESHOLD, BUMP_AMOUNT);
}

pub fn get_scan_window(env: &Env) -> Option<ScanWindow> {
    env.storage().instance().get(&DataKey::ScanWindow)
}

pub fn set_scan_window(env: &Env, window: &ScanWindow) {
    env.storage().instance().set(&DataKey::ScanWindow, window);
}
