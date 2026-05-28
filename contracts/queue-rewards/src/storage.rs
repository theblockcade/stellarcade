use soroban_sdk::{contracttype, Address, Env};
use crate::types::{RewardConfig, UserRewardState};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    UserState(Address),
}

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400; // ~30 days
pub const PERSISTENT_BUMP_THRESHOLD: u32 = 100_800; // ~7 days

pub fn get_config(env: &Env) -> Option<RewardConfig> {
    env.storage().instance().get(&DataKey::Config)
}

pub fn set_config(env: &Env, config: &RewardConfig) {
    env.storage().instance().set(&DataKey::Config, config);
}

pub fn get_user_state(env: &Env, user: &Address) -> Option<UserRewardState> {
    let key = DataKey::UserState(user.clone());
    let state = env.storage().persistent().get(&key);
    if state.is_some() {
        env.storage().persistent().extend_ttl(&key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_BUMP_LEDGERS);
    }
    state
}

pub fn set_user_state(env: &Env, user: &Address, state: &UserRewardState) {
    let key = DataKey::UserState(user.clone());
    env.storage().persistent().set(&key, state);
    env.storage().persistent().extend_ttl(&key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_BUMP_LEDGERS);
}
