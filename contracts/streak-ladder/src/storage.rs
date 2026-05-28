use soroban_sdk::{Address, Env};

use crate::{
    types::{BucketConfig, PlayerRecord},
    DataKey,
};

pub fn get_bucket(env: &Env, bucket_id: u32) -> Option<BucketConfig> {
    env.storage().persistent().get(&DataKey::Bucket(bucket_id))
}

pub fn set_bucket(env: &Env, bucket: &BucketConfig) {
    env.storage()
        .persistent()
        .set(&DataKey::Bucket(bucket.bucket_id), bucket);
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
