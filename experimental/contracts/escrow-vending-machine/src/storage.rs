use soroban_sdk::{contracttype, Address, Env};

use crate::types::Item;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Item(u64),
    UserPurchases(u64, Address),
}

pub fn get_item(env: &Env, item_id: u64) -> Option<Item> {
    env.storage().instance().get(&DataKey::Item(item_id))
}

pub fn set_item(env: &Env, item: &Item) {
    env.storage()
        .instance()
        .set(&DataKey::Item(item.item_id), item);
}

pub fn get_user_purchases(env: &Env, item_id: u64, user: &Address) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::UserPurchases(item_id, user.clone()))
        .unwrap_or(0u32)
}

pub fn set_user_purchases(env: &Env, item_id: u64, user: &Address, quantity: u32) {
    env.storage()
        .instance()
        .set(&DataKey::UserPurchases(item_id, user.clone()), &quantity);
}
