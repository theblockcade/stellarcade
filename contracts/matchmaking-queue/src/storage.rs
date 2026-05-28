use soroban_sdk::{Env, Symbol};

use crate::DataKey;

/// Return the number of matches ever created from a specific queue.
/// Returns 0 when the queue has never been used.
pub fn get_queue_match_count(env: &Env, queue_id: &Symbol) -> u64 {
    env.storage()
        .persistent()
        .get(&DataKey::QueueMatchCount(queue_id.clone()))
        .unwrap_or(0u64)
}

/// Increment the per-queue match counter. Called inside `create_match`.
/// Panics with `"Overflow"` if the counter wraps — an unreachable condition
/// in practice given ledger storage lifetimes.
pub fn increment_queue_match_count(env: &Env, queue_id: &Symbol) {
    let count = get_queue_match_count(env, queue_id);
    env.storage().persistent().set(
        &DataKey::QueueMatchCount(queue_id.clone()),
        &count.checked_add(1).expect("Overflow"),
    );
}
