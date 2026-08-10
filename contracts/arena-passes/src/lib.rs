#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

mod storage;
mod types;
#[cfg(test)]
mod test;

pub use types::{HolderUsageSnapshot, PassHolder, RenewalWindow};

/// Passes expire within this many seconds of expiry — renewal window is open.
const RENEWAL_WINDOW_SECS: u64 = 86_400; // 24 hours

#[contract]
pub struct ArenaPasses;

#[contractimpl]
impl ArenaPasses {
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_none() {
            storage::set_admin(&env, &admin);
        }
    }

    pub fn issue_passes(env: Env, admin: Address, holders: Vec<PassHolder>) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_holders(&env, &holders);
        }
    }

    pub fn use_pass(env: Env, holder_index: u32) {
        let mut holders = storage::get_holders(&env);
        for i in 0..holders.len() {
            let mut h = holders.get(i).unwrap();
            if h.holder_index == holder_index && h.uses_remaining > 0 {
                h.uses_remaining -= 1;
                holders.set(i, h);
                storage::set_holders(&env, &holders);
                return;
            }
        }
    }

    pub fn holder_usage_snapshot(env: Env) -> HolderUsageSnapshot {
        let now = env.ledger().timestamp();
        let holders = storage::get_holders(&env);
        let total_holders = holders.len();
        let mut active_holders = 0u32;
        let mut expired_holders = 0u32;
        let mut total_uses_remaining = 0u32;
        for i in 0..holders.len() {
            let h = holders.get(i).unwrap();
            if h.expires_at > now {
                active_holders += 1;
                total_uses_remaining += h.uses_remaining;
            } else {
                expired_holders += 1;
            }
        }
        HolderUsageSnapshot {
            total_holders,
            active_holders,
            expired_holders,
            total_uses_remaining,
        }
    }

    pub fn renewal_window(env: Env, holder_index: u32) -> RenewalWindow {
        let now = env.ledger().timestamp();
        let holders = storage::get_holders(&env);
        for i in 0..holders.len() {
            let h = holders.get(i).unwrap();
            if h.holder_index == holder_index {
                let seconds_until_expiry = if h.expires_at > now { h.expires_at - now } else { 0 };
                let in_renewal_window =
                    h.expires_at > now && seconds_until_expiry <= RENEWAL_WINDOW_SECS;
                return RenewalWindow {
                    holder_index,
                    is_found: true,
                    in_renewal_window,
                    seconds_until_expiry,
                };
            }
        }
        RenewalWindow {
            holder_index,
            is_found: false,
            in_renewal_window: false,
            seconds_until_expiry: 0,
        }
    }
}
