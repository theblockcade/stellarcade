use soroban_sdk::{Address, Env};

use crate::{DataKey, EpochState, StakerPosition};

/// Retrieve the current epoch state. Returns `None` when no epoch has started.
pub fn get_epoch(env: &Env) -> Option<EpochState> {
    let epoch_id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::CurrentEpochId)
        .unwrap_or(u64::MAX);
    if epoch_id == u64::MAX {
        return None;
    }
    env.storage().persistent().get(&DataKey::Epoch(epoch_id))
}

/// Persist an updated epoch state.
pub fn set_epoch(env: &Env, epoch: &EpochState) {
    env.storage()
        .persistent()
        .set(&DataKey::Epoch(epoch.epoch_id), epoch);
    env.storage()
        .instance()
        .set(&DataKey::CurrentEpochId, &epoch.epoch_id);
}

/// Retrieve a staker's position or return a zeroed default.
pub fn get_position(env: &Env, staker: &Address) -> StakerPosition {
    env.storage()
        .persistent()
        .get(&DataKey::Position(staker.clone()))
        .unwrap_or(StakerPosition {
            address: staker.clone(),
            staked_amount: 0,
            last_epoch_id: 0,
            total_claimed: 0,
        })
}

/// Persist an updated staker position.
pub fn set_position(env: &Env, position: &StakerPosition) {
    env.storage()
        .persistent()
        .set(&DataKey::Position(position.address.clone()), position);
}

/// Return the total staked tokens or 0 if not yet set.
pub fn get_total_staked(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::TotalStaked)
        .unwrap_or(0i128)
}

/// Persist the total staked amount.
pub fn set_total_staked(env: &Env, amount: i128) {
    env.storage().instance().set(&DataKey::TotalStaked, &amount);
}
