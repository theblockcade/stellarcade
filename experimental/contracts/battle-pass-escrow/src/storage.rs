use soroban_sdk::{Address, Env};

use crate::types::{DataKey, PlayerProgress, SeasonPool, PERSISTENT_BUMP_LEDGERS};

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Initialized)
}

pub fn require_initialized(env: &Env) -> Result<(), crate::types::Error> {
    if !is_initialized(env) {
        return Err(crate::types::Error::NotInitialized);
    }
    Ok(())
}

pub fn set_initialized(env: &Env) {
    env.storage().instance().set(&DataKey::Initialized, &true);
}

pub fn get_oracle(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Oracle).unwrap()
}

pub fn set_oracle(env: &Env, oracle: &Address) {
    env.storage().instance().set(&DataKey::Oracle, oracle);
}

pub fn get_token(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Token).unwrap()
}

pub fn set_token(env: &Env, token: &Address) {
    env.storage().instance().set(&DataKey::Token, token);
}

pub fn set_season_pool(env: &Env, season_id: u64, pool: &SeasonPool) {
    let key = DataKey::SeasonPool(season_id);
    env.storage().persistent().set(&key, pool);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_season_pool(env: &Env, season_id: u64) -> Result<SeasonPool, crate::types::Error> {
    let key = DataKey::SeasonPool(season_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(crate::types::Error::SeasonNotFound)
}

pub fn has_season_pool(env: &Env, season_id: u64) -> bool {
    let key = DataKey::SeasonPool(season_id);
    env.storage().persistent().has(&key)
}

pub fn set_player_progress(env: &Env, player: &Address, season_id: u64, progress: &PlayerProgress) {
    let key = DataKey::PlayerProgress(player.clone(), season_id);
    env.storage().persistent().set(&key, progress);
    env.storage()
        .persistent()
        .extend_ttl(&key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_player_progress(
    env: &Env,
    player: &Address,
    season_id: u64,
) -> Result<PlayerProgress, crate::types::Error> {
    let key = DataKey::PlayerProgress(player.clone(), season_id);
    env.storage()
        .persistent()
        .get(&key)
        .ok_or(crate::types::Error::InvalidInput)
}

pub fn has_player_progress(env: &Env, player: &Address, season_id: u64) -> bool {
    let key = DataKey::PlayerProgress(player.clone(), season_id);
    env.storage().persistent().has(&key)
}
