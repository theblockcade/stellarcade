use crate::types::CampaignRecord;
use crate::DataKey;
use soroban_sdk::Env;

pub fn set_campaign(env: &Env, record: &CampaignRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Campaign(record.campaign_id), record);
}

pub fn get_campaign(env: &Env, campaign_id: u64) -> Option<CampaignRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Campaign(campaign_id))
}

pub fn read_u32(env: &Env, key: &DataKey) -> u32 {
    env.storage().instance().get(key).unwrap_or(0)
}

pub fn read_i128(env: &Env, key: &DataKey) -> i128 {
    env.storage().instance().get(key).unwrap_or(0)
}

pub fn write_u32(env: &Env, key: &DataKey, value: u32) {
    env.storage().instance().set(key, &value);
}

pub fn write_i128(env: &Env, key: &DataKey, value: i128) {
    env.storage().instance().set(key, &value);
}

pub fn apply_count_delta(count: u32, delta: i32) -> u32 {
    if delta < 0 {
        count.saturating_sub((-delta) as u32)
    } else {
        count.saturating_add(delta as u32)
    }
}
