use soroban_sdk::{Address, Env, Vec};
use crate::types::{CooldownGapInfo, DataKey, QueuedReward, QueueStatus, UnlockQueueSummary};

/// Retrieve a queued reward by recipient and queue_id.
/// Returns None if not found.
pub fn get_queued_reward(env: &Env, recipient: &Address, queue_id: u32) -> Option<QueuedReward> {
    env.storage()
        .persistent()
        .get(&DataKey::QueuedReward(recipient.clone(), queue_id))
}

/// Store a queued reward.
pub fn set_queued_reward(env: &Env, recipient: &Address, queue_id: u32, reward: &QueuedReward) {
    env.storage()
        .persistent()
        .set(&DataKey::QueuedReward(recipient.clone(), queue_id), reward);
}

/// Get all queue IDs for a recipient.
/// Returns empty vec if recipient has no queued rewards.
pub fn get_recipient_queue_ids(env: &Env, recipient: &Address) -> Vec<u32> {
    env.storage()
        .persistent()
        .get(&DataKey::RecipientQueues(recipient.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

/// Store the queue ID list for a recipient.
pub fn set_recipient_queue_ids(env: &Env, recipient: &Address, queue_ids: &Vec<u32>) {
    env.storage()
        .persistent()
        .set(&DataKey::RecipientQueues(recipient.clone()), queue_ids);
}

/// Get cached total queued amount for a recipient.
pub fn get_recipient_total_queued(env: &Env, recipient: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::RecipientTotalQueued(recipient.clone()))
        .unwrap_or(0)
}

/// Update cached total queued amount.
pub fn set_recipient_total_queued(env: &Env, recipient: &Address, total: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::RecipientTotalQueued(recipient.clone()), &total);
}

/// Compute unlock queue summary for a recipient.
/// Handles empty queue and missing entries gracefully.
pub fn compute_unlock_queue_summary(
    env: &Env,
    recipient: &Address,
) -> UnlockQueueSummary {
    let queue_ids = get_recipient_queue_ids(env, recipient);

    if queue_ids.is_empty() {
        let current_ledger = env.ledger().sequence() as u32;
        return UnlockQueueSummary {
            total_queued_amount: 0,
            queue_size: 0,
            in_cooldown_count: 0,
            ready_to_claim_count: 0,
            earliest_ready_ledger: current_ledger,
        };
    }

    let current_ledger = env.ledger().sequence() as u32;
    let mut total_queued_amount: i128 = 0;
    let mut in_cooldown_count: u32 = 0;
    let mut ready_to_claim_count: u32 = 0;
    let mut earliest_ready_ledger: u32 = u32::MAX;

    for queue_id in queue_ids.iter() {
        if let Some(queued_reward) = get_queued_reward(env, recipient, queue_id) {
            total_queued_amount = total_queued_amount.checked_add(queued_reward.amount)
                .unwrap_or(total_queued_amount);

            let unlock_ledger = queued_reward.queued_ledger.checked_add(queued_reward.cooldown_ledgers)
                .unwrap_or(u32::MAX);

            if unlock_ledger > current_ledger {
                in_cooldown_count += 1;
                if unlock_ledger < earliest_ready_ledger {
                    earliest_ready_ledger = unlock_ledger;
                }
            } else {
                ready_to_claim_count += 1;
            }
        }
    }

    if earliest_ready_ledger == u32::MAX {
        earliest_ready_ledger = current_ledger;
    }

    UnlockQueueSummary {
        total_queued_amount,
        queue_size: queue_ids.len(),
        in_cooldown_count,
        ready_to_claim_count,
        earliest_ready_ledger,
    }
}

/// Check cooldown gap for a specific queue entry.
/// Handles missing entry gracefully.
pub fn get_cooldown_gap_info(
    env: &Env,
    recipient: &Address,
    queue_id: u32,
) -> CooldownGapInfo {
    let current_ledger = env.ledger().sequence() as u32;

    if let Some(queued_reward) = get_queued_reward(env, recipient, queue_id) {
        let unlock_eligible_ledger = queued_reward.queued_ledger
            .checked_add(queued_reward.cooldown_ledgers)
            .unwrap_or(u32::MAX);

        let (status, ledgers_remaining) = if unlock_eligible_ledger > current_ledger {
            (
                QueueStatus::InCooldown,
                unlock_eligible_ledger - current_ledger,
            )
        } else {
            (QueueStatus::ReadyToClaim, 0)
        };

        CooldownGapInfo {
            queue_id,
            status,
            amount: queued_reward.amount,
            queued_ledger: queued_reward.queued_ledger,
            cooldown_ledgers: queued_reward.cooldown_ledgers,
            unlock_eligible_ledger,
            current_ledger,
            ledgers_remaining_in_cooldown: ledgers_remaining,
        }
    } else {
        // Missing entry state
        CooldownGapInfo {
            queue_id,
            status: QueueStatus::ReadyToClaim, // Treat missing as claimable
            amount: 0,
            queued_ledger: 0,
            cooldown_ledgers: 0,
            unlock_eligible_ledger: 0,
            current_ledger,
            ledgers_remaining_in_cooldown: 0,
        }
    }
}
