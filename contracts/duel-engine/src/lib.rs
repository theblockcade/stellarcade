#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod types;
#[cfg(test)]
mod test;

pub use types::{OpenDuelSummary, ResolutionReadiness};

#[contract]
pub struct DuelEngine;

#[contractimpl]
impl DuelEngine {
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_none() {
            storage::set_admin(&env, &admin);
            storage::set_open_count(&env, 0);
            storage::set_oldest(&env, 0);
            storage::set_newest(&env, 0);
        }
    }

    pub fn create_duel(env: Env, admin: Address, duel_id: u64) {
        admin.require_auth();
        if storage::get_admin(&env) != Some(admin) || storage::is_paused(&env) {
            return;
        }
        if storage::get_duel_open(&env, duel_id).is_some() {
            return;
        }
        let count = storage::get_open_count(&env);
        storage::set_duel_open(&env, duel_id, true);
        storage::set_open_count(&env, count + 1);
        if storage::get_oldest(&env) == 0 {
            storage::set_oldest(&env, duel_id);
        }
        storage::set_newest(&env, duel_id);
    }

    pub fn resolve_duel(env: Env, admin: Address, duel_id: u64) {
        admin.require_auth();
        if storage::get_admin(&env) != Some(admin) {
            return;
        }
        if storage::get_duel_open(&env, duel_id) == Some(true) {
            let count = storage::get_open_count(&env);
            storage::set_duel_open(&env, duel_id, false);
            storage::set_open_count(&env, count.saturating_sub(1));
        }
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_paused(&env, paused);
        }
    }

    pub fn open_duel_summary(env: Env) -> OpenDuelSummary {
        OpenDuelSummary {
            open_count: storage::get_open_count(&env),
            oldest_open_duel_id: storage::get_oldest(&env),
            newest_open_duel_id: storage::get_newest(&env),
            paused: storage::is_paused(&env),
        }
    }

    pub fn resolution_readiness(env: Env, duel_id: u64) -> ResolutionReadiness {
        match storage::get_duel_open(&env, duel_id) {
            Some(is_open) => ResolutionReadiness {
                duel_id,
                exists: true,
                is_open,
                is_ready_to_resolve: is_open && !storage::is_paused(&env),
            },
            None => ResolutionReadiness {
                duel_id,
                exists: false,
                is_open: false,
                is_ready_to_resolve: false,
            },
        }
    }
}
