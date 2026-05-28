use soroban_sdk::{contracttype, Env};
use crate::types::{MatchConfig, MatchState};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    Match(u32),
}

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400; // ~30 days
pub const PERSISTENT_BUMP_THRESHOLD: u32 = 100_800; // ~7 days

pub fn get_config(env: &Env) -> Option<MatchConfig> {
    env.storage().instance().get(&DataKey::Config)
}

pub fn set_config(env: &Env, config: &MatchConfig) {
    env.storage().instance().set(&DataKey::Config, config);
}

pub fn get_match(env: &Env, match_id: u32) -> Option<MatchState> {
    let key = DataKey::Match(match_id);
    let state = env.storage().persistent().get(&key);
    if state.is_some() {
        env.storage().persistent().extend_ttl(&key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_BUMP_LEDGERS);
    }
    state
}

pub fn set_match(env: &Env, match_id: u32, state: &MatchState) {
    let key = DataKey::Match(match_id);
    env.storage().persistent().set(&key, state);
    env.storage().persistent().extend_ttl(&key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_BUMP_LEDGERS);
}
