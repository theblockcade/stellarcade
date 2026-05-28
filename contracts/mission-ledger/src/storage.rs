use crate::types::MissionRecord;
use crate::DataKey;
use soroban_sdk::{Address, Env};

pub fn set_mission(env: &Env, record: &MissionRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Mission(record.mission_id), record);
}

pub fn get_mission(env: &Env, mission_id: u64) -> Option<MissionRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Mission(mission_id))
}

pub fn set_player_progress(env: &Env, mission_id: u64, player: &Address, progress: u32) {
    env.storage().persistent().set(
        &DataKey::PlayerProgress(mission_id, player.clone()),
        &progress,
    );
}

pub fn get_player_progress(env: &Env, mission_id: u64, player: &Address) -> Option<u32> {
    env.storage()
        .persistent()
        .get(&DataKey::PlayerProgress(mission_id, player.clone()))
}

pub fn mark_player_claimed(env: &Env, mission_id: u64, player: &Address) {
    env.storage()
        .persistent()
        .set(&DataKey::PlayerClaimed(mission_id, player.clone()), &true);
}

pub fn has_player_claimed(env: &Env, mission_id: u64, player: &Address) -> bool {
    env.storage()
        .persistent()
        .get(&DataKey::PlayerClaimed(mission_id, player.clone()))
        .unwrap_or(false)
}
