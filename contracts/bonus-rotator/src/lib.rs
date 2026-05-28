#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod types;
#[cfg(test)]
mod test;

pub use types::{ActiveBonusCycleSnapshot, BonusCycle};

#[contract]
pub struct BonusRotator;

#[contractimpl]
impl BonusRotator {
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_none() {
            storage::set_admin(&env, &admin);
            storage::set_paused(&env, false);
        }
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_paused(&env, paused);
        }
    }

    pub fn set_active_cycle(
        env: Env,
        admin: Address,
        cycle_id: u64,
        bonus_bps: u32,
        starts_at: u64,
        ends_at: u64,
    ) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_cycle(
                &env,
                &BonusCycle {
                    cycle_id,
                    bonus_bps,
                    starts_at,
                    ends_at,
                },
            );
        }
    }

    pub fn active_bonus_cycle_snapshot(env: Env) -> ActiveBonusCycleSnapshot {
        let now = env.ledger().timestamp();
        if let Some(c) = storage::get_cycle(&env) {
            ActiveBonusCycleSnapshot {
                has_active_cycle: true,
                paused: storage::is_paused(&env),
                now,
                cycle_id: c.cycle_id,
                bonus_bps: c.bonus_bps,
                starts_at: c.starts_at,
                ends_at: c.ends_at,
            }
        } else {
            ActiveBonusCycleSnapshot {
                has_active_cycle: false,
                paused: storage::is_paused(&env),
                now,
                cycle_id: 0,
                bonus_bps: 0,
                starts_at: 0,
                ends_at: 0,
            }
        }
    }

    pub fn next_rollover_at(env: Env) -> u64 {
        storage::get_cycle(&env).map(|c| c.ends_at).unwrap_or(0)
    }
}
