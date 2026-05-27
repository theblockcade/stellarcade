use soroban_sdk::Env;

use crate::{DataKey, types::{VoucherRecord, VoucherTypeRecord}};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_voucher_type(env: &Env, type_id: u32) -> Option<VoucherTypeRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::VoucherType(type_id))
}

pub fn set_voucher_type(env: &Env, type_id: u32, record: &VoucherTypeRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::VoucherType(type_id), record);
    env.storage().persistent().extend_ttl(
        &DataKey::VoucherType(type_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_voucher(env: &Env, voucher_id: u64) -> Option<VoucherRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Voucher(voucher_id))
}

pub fn set_voucher(env: &Env, voucher_id: u64, record: &VoucherRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Voucher(voucher_id), record);
    env.storage().persistent().extend_ttl(
        &DataKey::Voucher(voucher_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
