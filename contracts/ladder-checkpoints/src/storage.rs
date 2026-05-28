use soroban_sdk::{Address, Env};

use crate::{
    types::{CheckpointConfig, PlayerRecord},
    DataKey,
};

pub fn get_checkpoint(env: &Env, checkpoint_id: u32) -> Option<CheckpointConfig> {
    env.storage()
        .persistent()
        .get(&DataKey::Checkpoint(checkpoint_id))
}

pub fn set_checkpoint(env: &Env, checkpoint: &CheckpointConfig) {
    env.storage()
        .persistent()
        .set(&DataKey::Checkpoint(checkpoint.checkpoint_id), checkpoint);
}

pub fn get_player(env: &Env, user: &Address) -> Option<PlayerRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Player(user.clone()))
}

pub fn set_player(env: &Env, user: &Address, player: &PlayerRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Player(user.clone()), player);
}
