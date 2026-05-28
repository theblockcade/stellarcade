use soroban_sdk::{Address, Env};

use crate::{
    types::{MemberRecord, PoolConfig},
    DataKey,
};

pub fn get_pool(env: &Env, pool_id: u32) -> Option<PoolConfig> {
    env.storage().persistent().get(&DataKey::Pool(pool_id))
}

pub fn set_pool(env: &Env, pool: &PoolConfig) {
    env.storage()
        .persistent()
        .set(&DataKey::Pool(pool.pool_id), pool);
}

pub fn get_member(env: &Env, member: &Address) -> Option<MemberRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Member(member.clone()))
}

pub fn set_member(env: &Env, member: &Address, record: &MemberRecord) {
    env.storage()
        .persistent()
        .set(&DataKey::Member(member.clone()), record);
}
