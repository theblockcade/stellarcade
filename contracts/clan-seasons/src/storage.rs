use soroban_sdk::Env;

use crate::{DataKey, types::SeasonRecord};

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

pub fn get_season(env: &Env, season_id: u32) -> Option<SeasonRecord> {
    env.storage().persistent().get(&DataKey::Season(season_id))
}

pub fn set_season(env: &Env, season_id: u32, record: &SeasonRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Season(season_id), record);
    env.storage().persistent().extend_ttl(
        &DataKey::Season(season_id),
        PERSISTENT_BUMP_LEDGERS,
        PERSISTENT_BUMP_LEDGERS,
    );
}
