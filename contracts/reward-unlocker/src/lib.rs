//! Stellarcade Reward Unlocker Contract
//!
//! Manages queued reward unlocks with cooldown-gap accessors.
//! Provides stable structured contract reads with predictable fallback behavior
//! and reusable storage aggregates for frontend/backend consumers.
//!
//! ## Features
//! - **Unlock Queue Summary**: Aggregated snapshot of all pending rewards
//! - **Cooldown-Gap Accessor**: Per-entry unlock status and remaining cooldown
//! - **Predictable Fallbacks**: Explicit handling of empty/blocked/missing-state scenarios
//! - **Reusable Storage Aggregates**: Cached totals and persistent ledger entries

#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, Address, Env, Vec};

mod types;
mod storage;

use types::{CooldownGapInfo, DataKey, QueuedReward, QueueStatus, UnlockQueueSummary};
use storage::{
    compute_unlock_queue_summary, get_cooldown_gap_info, get_queued_reward, 
    get_recipient_queue_ids, get_recipient_total_queued, get_recipient_total_queued,
    set_queued_reward, set_recipient_queue_ids, set_recipient_total_queued,
};

// ──────────────────────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────────────────────

#[contractevent]
pub struct RewardQueued {
    #[topic]
    pub recipient: Address,
    pub queue_id: u32,
    pub amount: i128,
    pub cooldown_ledgers: u32,
}

#[contractevent]
pub struct RewardClaimed {
    #[topic]
    pub recipient: Address,
    pub queue_id: u32,
    pub amount: i128,
}

#[contractevent]
pub struct AdminSet {
    pub admin: Address,
}

// ──────────────────────────────────────────────────────────────
// Contract
// ──────────────────────────────────────────────────────────────

#[contract]
pub struct RewardUnlocker;

#[contractimpl]
impl RewardUnlocker {
    /// Initialize the contract with a super admin.
    /// Can only be called once.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::NextQueueId, &1u32);

        AdminSet { admin }.publish(&env);
    }

    /// Get the current admin.
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized")
    }

    /// Queue a reward for unlock after a cooldown period.
    pub fn queue_reward(
        env: Env,
        recipient: Address,
        amount: i128,
        cooldown_ledgers: u32,
    ) -> u32 {
        require_admin(&env);

        if amount <= 0 {
            panic!("Invalid amount");
        }

        if cooldown_ledgers == 0 {
            panic!("Invalid cooldown");
        }

        let current_ledger = env.ledger().sequence() as u32;

        // Get next queue ID
        let queue_id: u32 = env
            .storage()
            .instance()
            .get(&DataKey::NextQueueId)
            .unwrap_or(1);

        // Create queue entry
        let queued_reward = QueuedReward {
            recipient: recipient.clone(),
            amount,
            queued_ledger: current_ledger,
            cooldown_ledgers,
            queue_id,
        };

        // Store queue entry
        set_queued_reward(&env, &recipient, queue_id, &queued_reward);

        // Add to recipient's queue list
        let mut queue_ids = get_recipient_queue_ids(&env, &recipient);
        queue_ids.push_back(queue_id);
        set_recipient_queue_ids(&env, &recipient, &queue_ids);

        // Update cache
        let current_total = get_recipient_total_queued(&env, &recipient);
        let new_total = current_total.checked_add(amount).unwrap_or(current_total);
        set_recipient_total_queued(&env, &recipient, new_total);

        // Increment next queue ID
        let next_id = queue_id.checked_add(1).unwrap_or(queue_id);
        env.storage().instance().set(&DataKey::NextQueueId, &next_id);

        RewardQueued {
            recipient,
            queue_id,
            amount,
            cooldown_ledgers,
        }
        .publish(&env);

        queue_id
    }

    /// Claim a reward that has finished its cooldown.
    pub fn claim_queued_reward(env: Env, recipient: Address, queue_id: u32) -> i128 {
        recipient.require_auth();

        if let Some(queued_reward) = get_queued_reward(&env, &recipient, queue_id) {
            let current_ledger = env.ledger().sequence() as u32;
            let unlock_ledger = queued_reward.queued_ledger
                .checked_add(queued_reward.cooldown_ledgers)
                .unwrap_or(u32::MAX);

            if current_ledger < unlock_ledger {
                panic!("Reward still in cooldown");
            }

            let amount = queued_reward.amount;

            // Remove from storage
            env.storage()
                .persistent()
                .remove(&DataKey::QueuedReward(recipient.clone(), queue_id));

            // Remove from queue list
            let mut queue_ids = get_recipient_queue_ids(&env, &recipient);
            let mut new_ids = Vec::new(&env);
            for id in queue_ids.iter() {
                if id != queue_id {
                    new_ids.push_back(id);
                }
            }
            set_recipient_queue_ids(&env, &recipient, &new_ids);

            // Update cache
            let current_total = get_recipient_total_queued(&env, &recipient);
            let new_total = current_total.checked_sub(amount).unwrap_or(0);
            set_recipient_total_queued(&env, &recipient, new_total);

            RewardClaimed {
                recipient,
                queue_id,
                amount,
            }
            .publish(&env);

            amount
        } else {
            panic!("Queue entry not found");
        }
    }

    /// Get a summary of all queued rewards for a recipient.
    /// Returns graceful empty state if no rewards queued.
    pub fn get_unlock_queue_summary(env: Env, recipient: Address) -> UnlockQueueSummary {
        compute_unlock_queue_summary(&env, &recipient)
    }

    /// Get cooldown gap info for a specific queue entry.
    /// Handles missing entry by treating as ready to claim.
    pub fn get_cooldown_gap(
        env: Env,
        recipient: Address,
        queue_id: u32,
    ) -> CooldownGapInfo {
        get_cooldown_gap_info(&env, &recipient, queue_id)
    }

    /// List all queue IDs for a recipient (paginated).
    pub fn list_queued_rewards(
        env: Env,
        recipient: Address,
        start: u32,
        limit: u32,
    ) -> Vec<u32> {
        let all_queues = get_recipient_queue_ids(&env, &recipient);
        let total = all_queues.len();

        let mut result = Vec::new(&env);
        let end = start.saturating_add(limit).min(total);

        for i in start..end {
            if let Some(queue_id) = all_queues.get(i) {
                result.push_back(queue_id);
            }
        }

        result
    }
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

fn require_admin(env: &Env) {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    admin.require_auth();
}

#[cfg(test)]
mod test;
