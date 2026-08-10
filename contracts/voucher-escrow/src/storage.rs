use soroban_sdk::{contracttype, Env};
use crate::types::{EscrowRecord, ReservedVoucherSummary};

#[contracttype]
pub enum DataKey {
    Admin,
    Escrow(u64),
    NextId,
    Summary,
}

pub fn get_admin(env: &Env) -> Option<soroban_sdk::Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &soroban_sdk::Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn get_escrow(env: &Env, voucher_id: u64) -> Option<EscrowRecord> {
    env.storage().persistent().get(&DataKey::Escrow(voucher_id))
}

pub fn set_escrow(env: &Env, record: &EscrowRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Escrow(record.voucher_id), record);
}

pub fn get_next_id(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::NextId).unwrap_or(1)
}

pub fn set_next_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextId, &id);
}

pub fn get_summary(env: &Env) -> ReservedVoucherSummary {
    env.storage()
        .instance()
        .get(&DataKey::Summary)
        .unwrap_or(ReservedVoucherSummary {
            total_reserved: 0,
            active_escrow_count: 0,
            expired_escrow_count: 0,
            claimed_count: 0,
        })
}

pub fn set_summary(env: &Env, summary: &ReservedVoucherSummary) {
    env.storage().instance().set(&DataKey::Summary, summary);
}
