use soroban_sdk::{Address, Env};

use crate::{types::CampaignRecord, DataKey};

pub fn get_campaign(env: &Env, campaign_id: u64) -> Option<CampaignRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Campaign(campaign_id))
}

pub fn set_campaign(env: &Env, campaign: &CampaignRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Campaign(campaign.campaign_id), campaign);
}

pub fn get_pending_claim(env: &Env, campaign_id: u64, user: &Address) -> Option<i128> {
    env.storage()
        .persistent()
        .get(&DataKey::PendingClaim(campaign_id, user.clone()))
}

pub fn set_pending_claim(env: &Env, campaign_id: u64, user: &Address, amount: &i128) {
    env.storage()
        .persistent()
        .set(&DataKey::PendingClaim(campaign_id, user.clone()), amount);
}

pub fn remove_pending_claim(env: &Env, campaign_id: u64, user: &Address) {
    env.storage()
        .persistent()
        .remove(&DataKey::PendingClaim(campaign_id, user.clone()));
}
