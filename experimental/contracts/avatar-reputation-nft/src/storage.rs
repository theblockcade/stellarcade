use soroban_sdk::{contracttype, Address, Env};

use crate::types::Avatar;

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    NextTokenId,
    Avatar(u64),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn read_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn write_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn next_token_id(env: &Env) -> u64 {
    let id: u64 = env
        .storage()
        .instance()
        .get(&DataKey::NextTokenId)
        .unwrap_or(0);
    env.storage()
        .instance()
        .set(&DataKey::NextTokenId, &(id + 1));
    id
}

pub fn read_avatar(env: &Env, token_id: u64) -> Option<Avatar> {
    env.storage().persistent().get(&DataKey::Avatar(token_id))
}

pub fn write_avatar(env: &Env, avatar: &Avatar) {
    let key = DataKey::Avatar(avatar.token_id);
    env.storage().persistent().set(&key, avatar);
    extend(env, &key);
}

pub fn tier_for_level(level: u32) -> crate::types::AchievementTier {
    use crate::types::AchievementTier;
    if level >= 20 {
        AchievementTier::Neon
    } else if level >= 10 {
        AchievementTier::Gold
    } else if level >= 5 {
        AchievementTier::Silver
    } else {
        AchievementTier::Bronze
    }
}
