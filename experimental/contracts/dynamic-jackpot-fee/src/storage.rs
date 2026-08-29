use soroban_sdk::{contracttype, Env};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub const MIN_FEE_BPS: u32 = 100;
pub const MAX_FEE_BPS: u32 = 250;
pub const LOW_VOLUME_THRESHOLD: u128 = 10_000;
pub const HIGH_VOLUME_THRESHOLD: u128 = 1_000_000;
pub const JACKPOT_SHARE_BPS: u32 = 3_000;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TotalVolume,
    JackpotPool,
    LastResetTimestamp,
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_admin(env: &Env) -> Option<soroban_sdk::Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn write_admin(env: &Env, admin: &soroban_sdk::Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn read_total_volume(env: &Env) -> u128 {
    env.storage()
        .persistent()
        .get(&DataKey::TotalVolume)
        .unwrap_or(0)
}

pub fn write_total_volume(env: &Env, volume: u128) {
    let key = DataKey::TotalVolume;
    env.storage().persistent().set(&key, &volume);
    extend(env, &key);
}

pub fn read_jackpot_pool(env: &Env) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::JackpotPool)
        .unwrap_or(0)
}

pub fn write_jackpot_pool(env: &Env, amount: i128) {
    let key = DataKey::JackpotPool;
    env.storage().persistent().set(&key, &amount);
    extend(env, &key);
}

pub fn write_last_reset_timestamp(env: &Env, ts: u64) {
    let key = DataKey::LastResetTimestamp;
    env.storage().persistent().set(&key, &ts);
    extend(env, &key);
}

pub fn calculate_fee_bps(volume: u128) -> u32 {
    if volume <= LOW_VOLUME_THRESHOLD {
        MAX_FEE_BPS
    } else if volume >= HIGH_VOLUME_THRESHOLD {
        MIN_FEE_BPS
    } else {
        let range = HIGH_VOLUME_THRESHOLD - LOW_VOLUME_THRESHOLD;
        let progress = volume - LOW_VOLUME_THRESHOLD;
        let fee_range = MAX_FEE_BPS - MIN_FEE_BPS;
        let reduction = ((progress * fee_range as u128) / range) as u32;
        MAX_FEE_BPS - reduction
    }
}
