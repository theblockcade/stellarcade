use soroban_sdk::Env;

use crate::{
    types::{RoundVoucherRecord, VoucherRoundRecord},
    DataKey,
};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_round(env: &Env, round_id: u32) -> Option<VoucherRoundRecord> {
    env.storage().persistent().get(&DataKey::Round(round_id))
}

pub fn set_round(env: &Env, round_id: u32, record: &VoucherRoundRecord) {
    env.storage().persistent().set(&DataKey::Round(round_id), record);
    env.storage().persistent().extend_ttl(
        &DataKey::Round(round_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_voucher(env: &Env, voucher_id: u64) -> Option<RoundVoucherRecord> {
    env.storage().persistent().get(&DataKey::Voucher(voucher_id))
}

pub fn set_voucher(env: &Env, voucher_id: u64, record: &RoundVoucherRecord) {
    env.storage().persistent().set(&DataKey::Voucher(voucher_id), record);
    env.storage().persistent().extend_ttl(
        &DataKey::Voucher(voucher_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
