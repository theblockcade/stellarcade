use soroban_sdk::{Address, Env};

use crate::{
    types::{PlayerStampProgress, StampCampaign},
    DataKey,
};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_campaign(env: &Env, campaign_id: u32) -> Option<StampCampaign> {
    env.storage()
        .persistent()
        .get(&DataKey::Campaign(campaign_id))
}

pub fn set_campaign(env: &Env, campaign_id: u32, campaign: &StampCampaign) {
    env.storage()
        .persistent()
        .set(&DataKey::Campaign(campaign_id), campaign);
    env.storage().persistent().extend_ttl(
        &DataKey::Campaign(campaign_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}

pub fn get_progress(
    env: &Env,
    player: &Address,
    campaign_id: u32,
) -> Option<PlayerStampProgress> {
    env.storage()
        .persistent()
        .get(&DataKey::Progress(player.clone(), campaign_id))
}

pub fn set_progress(
    env: &Env,
    player: &Address,
    campaign_id: u32,
    progress: &PlayerStampProgress,
) {
    env.storage()
        .persistent()
        .set(&DataKey::Progress(player.clone(), campaign_id), progress);
    env.storage().persistent().extend_ttl(
        &DataKey::Progress(player.clone(), campaign_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
