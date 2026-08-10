#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

mod storage;
mod types;
#[cfg(test)]
mod test;

pub use types::{BridgeEntry, BridgeQueueSummary, SettlementGap};

#[contract]
pub struct RewardBridges;

#[contractimpl]
impl RewardBridges {
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_none() {
            storage::set_admin(&env, &admin);
        }
    }

    pub fn enqueue(env: Env, admin: Address, entries: Vec<BridgeEntry>) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_entries(&env, &entries);
        }
    }

    pub fn settle(env: Env, entry_id: u64) {
        let mut entries = storage::get_entries(&env);
        for i in 0..entries.len() {
            let mut e = entries.get(i).unwrap();
            if e.entry_id == entry_id && !e.settled {
                e.settled = true;
                entries.set(i, e);
                storage::set_entries(&env, &entries);
                return;
            }
        }
    }

    pub fn bridge_queue_summary(env: Env) -> BridgeQueueSummary {
        let entries = storage::get_entries(&env);
        let total_entries = entries.len();
        let mut pending_count = 0u32;
        let mut settled_count = 0u32;
        let mut total_pending_amount = 0i128;
        for i in 0..entries.len() {
            let e = entries.get(i).unwrap();
            if e.settled {
                settled_count += 1;
            } else {
                pending_count += 1;
                total_pending_amount += e.amount;
            }
        }
        BridgeQueueSummary {
            total_entries,
            pending_count,
            settled_count,
            total_pending_amount,
        }
    }

    pub fn settlement_gap(env: Env) -> SettlementGap {
        let now = env.ledger().timestamp();
        let entries = storage::get_entries(&env);
        let mut earliest_settle_after = u64::MAX;
        let mut next_entry_id = 0u64;
        let mut has_pending = false;
        for i in 0..entries.len() {
            let e = entries.get(i).unwrap();
            if !e.settled && e.settle_after < earliest_settle_after {
                earliest_settle_after = e.settle_after;
                next_entry_id = e.entry_id;
                has_pending = true;
            }
        }
        if !has_pending {
            return SettlementGap {
                has_pending: false,
                seconds_until_next_settlement: 0,
                next_entry_id: 0,
            };
        }
        SettlementGap {
            has_pending: true,
            seconds_until_next_settlement: if earliest_settle_after > now {
                earliest_settle_after - now
            } else {
                0
            },
            next_entry_id,
        }
    }
}
