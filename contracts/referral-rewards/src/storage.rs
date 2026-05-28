use soroban_sdk::{Address, Env};

use crate::{types::InviterAccount, DataKey};

pub fn get_account(env: &Env, inviter: &Address) -> Option<InviterAccount> {
    env.storage()
        .persistent()
        .get(&DataKey::Inviter(inviter.clone()))
}

pub fn set_account(env: &Env, inviter: &Address, account: &InviterAccount) {
    env.storage()
        .persistent()
        .set(&DataKey::Inviter(inviter.clone()), account);
}
