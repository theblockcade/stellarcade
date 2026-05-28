#![no_std]

use soroban_sdk::{Address, Env, Map, Vec};
use crate::{DataKey, QuestCompletion, CompletionQueueSnapshot, RewardDelayAccessor};

/// Storage utilities for quest ledger v2
pub struct Storage;

impl Storage {
    /// Get all quest completion IDs
    pub fn get_all_quest_ids(env: &Env) -> Vec<u64> {
        // In a real implementation, we would maintain a separate index
        // For now, return empty vector as we don't have iteration capabilities
        Vec::new(env)
    }

    /// Get quest completion by ID
    pub fn get_quest_completion(env: &Env, quest_id: u64) -> Option<QuestCompletion> {
        env.storage()
            .persistent()
            .get(&DataKey::QuestCompletion(quest_id))
    }

    /// Set quest completion
    pub fn set_quest_completion(env: &Env, quest_id: u64, completion: &QuestCompletion) {
        env.storage()
            .persistent()
            .set(&DataKey::QuestCompletion(quest_id), completion);
    }

    /// Remove quest completion
    pub fn remove_quest_completion(env: &Env, quest_id: u64) {
        env.storage()
            .persistent()
            .remove(&DataKey::QuestCompletion(quest_id));
    }

    /// Check if quest completion exists
    pub fn has_quest_completion(env: &Env, quest_id: u64) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::QuestCompletion(quest_id))
    }

    /// Get reward delay accessor
    pub fn get_reward_delay(env: &Env, quest_id: u64) -> Option<RewardDelayAccessor> {
        env.storage()
            .persistent()
            .get(&DataKey::RewardDelay(quest_id))
    }

    /// Set reward delay accessor
    pub fn set_reward_delay(env: &Env, quest_id: u64, delay: &RewardDelayAccessor) {
        env.storage()
            .persistent()
            .set(&DataKey::RewardDelay(quest_id), delay);
    }

    /// Get queue snapshot by timestamp
    pub fn get_queue_snapshot(env: &Env, timestamp: u64) -> Option<CompletionQueueSnapshot> {
        env.storage()
            .persistent()
            .get(&DataKey::QueueSnapshot(timestamp))
    }

    /// Set queue snapshot
    pub fn set_queue_snapshot(env: &Env, timestamp: u64, snapshot: &CompletionQueueSnapshot) {
        env.storage()
            .persistent()
            .set(&DataKey::QueueSnapshot(timestamp), snapshot);
    }

    /// Get total quests count
    pub fn get_total_quests(env: &Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::TotalQuests)
            .unwrap_or(0)
    }

    /// Set total quests count
    pub fn set_total_quests(env: &Env, total: u64) {
        env.storage()
            .persistent()
            .set(&DataKey::TotalQuests, &total);
    }

    /// Extend TTL for quest completion data
    pub fn extend_quest_completion_ttl(env: &Env, quest_id: u64) {
        let key = DataKey::QuestCompletion(quest_id);
        env.storage().persistent().extend_ttl(&key, 100, 100);
    }

    /// Extend TTL for reward delay data
    pub fn extend_reward_delay_ttl(env: &Env, quest_id: u64) {
        let key = DataKey::RewardDelay(quest_id);
        env.storage().persistent().extend_ttl(&key, 100, 100);
    }

    /// Extend TTL for queue snapshot data
    pub fn extend_queue_snapshot_ttl(env: &Env, timestamp: u64) {
        let key = DataKey::QueueSnapshot(timestamp);
        env.storage().persistent().extend_ttl(&key, 100, 100);
    }

    /// Extend TTL for global data
    pub fn extend_global_ttl(env: &Env) {
        env.storage().persistent().extend_ttl(&DataKey::Admin, 100, 100);
        env.storage().persistent().extend_ttl(&DataKey::Initialized, 100, 100);
        env.storage().persistent().extend_ttl(&DataKey::Paused, 100, 100);
        env.storage().persistent().extend_ttl(&DataKey::TotalQuests, 100, 100);
    }
}