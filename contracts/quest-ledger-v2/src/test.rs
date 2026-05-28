#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, symbol_short};

fn setup_contract() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    let token = Address::generate(&env);
    
    QuestLedgerV2::init(env.clone(), admin.clone()).unwrap();
    
    (env, admin, player1, player2, token)
}

#[test]
fn test_complete_quest_flow() {
    let (env, admin, player1, player2, token) = setup_contract();
    
    // Complete multiple quests
    QuestLedgerV2::complete_quest(env.clone(), player1.clone(), 1, 100, token.clone()).unwrap();
    QuestLedgerV2::complete_quest(env.clone(), player2.clone(), 2, 200, token.clone()).unwrap();
    
    // Verify completions
    let completion1 = QuestLedgerV2::get_quest_completion(env.clone(), 1).unwrap();
    assert_eq!(completion1.quest_id, 1);
    assert_eq!(completion1.player, player1);
    assert_eq!(completion1.reward_amount, 100);
    assert_eq!(completion1.status, symbol_short!("PENDING"));
    
    let completion2 = QuestLedgerV2::get_quest_completion(env.clone(), 2).unwrap();
    assert_eq!(completion2.quest_id, 2);
    assert_eq!(completion2.player, player2);
    assert_eq!(completion2.reward_amount, 200);
    
    // Update status
    QuestLedgerV2::update_completion_status(env.clone(), admin, 1, symbol_short!("COMPLETE")).unwrap();
    
    let updated_completion = QuestLedgerV2::get_quest_completion(env, 1).unwrap();
    assert_eq!(updated_completion.status, symbol_short!("COMPLETE"));
}

#[test]
fn test_completion_queue_snapshot() {
    let (env, _, player1, player2, token) = setup_contract();
    
    // Complete some quests
    QuestLedgerV2::complete_quest(env.clone(), player1, 1, 100, token.clone()).unwrap();
    QuestLedgerV2::complete_quest(env.clone(), player2, 2, 200, token).unwrap();
    
    // Get snapshot
    let snapshot = QuestLedgerV2::get_completion_queue_snapshot(env.clone()).unwrap();
    assert_eq!(snapshot.total_pending, 2);
    assert!(snapshot.oldest_pending.is_some());
    assert!(snapshot.newest_pending.is_some());
    assert_eq!(snapshot.average_processing_time, 1800);
    
    // Verify snapshot is stored
    let stored_snapshot = env.storage()
        .persistent()
        .get::<DataKey, CompletionQueueSnapshot>(&DataKey::QueueSnapshot(snapshot.timestamp));
    assert!(stored_snapshot.is_some());
}

#[test]
fn test_reward_delay_accessor() {
    let (env, admin, _, _, _) = setup_contract();
    
    // Set reward delay
    QuestLedgerV2::set_reward_delay(
        env.clone(), 
        admin.clone(), 
        1, 
        3600, 
        symbol_short!("REVIEW")
    ).unwrap();
    
    // Get delay accessor
    let accessor = QuestLedgerV2::get_reward_delay_accessor(env.clone(), 1).unwrap();
    assert_eq!(accessor.quest_id, 1);
    assert_eq!(accessor.base_delay, 3600);
    assert_eq!(accessor.current_delay, 3600);
    assert_eq!(accessor.delay_reason, symbol_short!("REVIEW"));
    assert_eq!(accessor.estimated_processing_time, 7200); // 3600 + 3600 buffer
    assert_eq!(accessor.priority_level, 3);
    assert!(accessor.can_expedite);
    
    // Test default accessor for non-existent quest
    let default_accessor = QuestLedgerV2::get_reward_delay_accessor(env, 999).unwrap();
    assert_eq!(default_accessor.quest_id, 999);
    assert_eq!(default_accessor.base_delay, 0);
    assert_eq!(default_accessor.delay_reason, symbol_short!("NONE"));
}

#[test]
fn test_queue_metrics() {
    let (env, _, player1, player2, token) = setup_contract();
    
    // Complete some quests
    QuestLedgerV2::complete_quest(env.clone(), player1, 1, 100, token.clone()).unwrap();
    QuestLedgerV2::complete_quest(env.clone(), player2, 2, 200, token).unwrap();
    
    // Get metrics
    let metrics = QuestLedgerV2::get_queue_metrics(env).unwrap();
    assert_eq!(metrics.total_completions, 2);
    assert_eq!(metrics.pending_completions, 2);
    assert_eq!(metrics.processing_completions, 0);
    assert_eq!(metrics.delayed_completions, 0);
    assert_eq!(metrics.failed_completions, 0);
    assert_eq!(metrics.average_completion_time, 1800);
    assert_eq!(metrics.throughput_per_hour, 10);
}

#[test]
fn test_empty_state_handling() {
    let (env, _, _, _, _) = setup_contract();
    
    // Test empty queue snapshot
    let snapshot = QuestLedgerV2::get_completion_queue_snapshot(env.clone()).unwrap();
    assert_eq!(snapshot.total_pending, 0);
    assert_eq!(snapshot.total_processing, 0);
    assert_eq!(snapshot.total_delayed, 0);
    assert!(snapshot.oldest_pending.is_none());
    assert!(snapshot.newest_pending.is_none());
    
    // Test empty metrics
    let metrics = QuestLedgerV2::get_queue_metrics(env.clone()).unwrap();
    assert_eq!(metrics.total_completions, 0);
    assert_eq!(metrics.pending_completions, 0);
    
    // Test non-existent quest completion
    let result = QuestLedgerV2::get_quest_completion(env, 999);
    assert_eq!(result, Err(Error::CompletionNotFound));
}

#[test]
fn test_paused_state_behavior() {
    let (env, admin, player1, _, token) = setup_contract();
    
    // Pause the contract
    QuestLedgerV2::pause(env.clone(), admin.clone()).unwrap();
    
    // Test that mutations are blocked when paused
    let result = QuestLedgerV2::complete_quest(env.clone(), player1.clone(), 1, 100, token.clone());
    assert_eq!(result, Err(Error::Paused));
    
    let result = QuestLedgerV2::set_reward_delay(env.clone(), admin.clone(), 1, 3600, symbol_short!("TEST"));
    assert_eq!(result, Err(Error::Paused));
    
    let result = QuestLedgerV2::update_completion_status(env.clone(), admin.clone(), 1, symbol_short!("COMPLETE"));
    assert_eq!(result, Err(Error::Paused));
    
    // Test that reads still work when paused
    let snapshot = QuestLedgerV2::get_completion_queue_snapshot(env.clone());
    assert!(snapshot.is_ok());
    
    let metrics = QuestLedgerV2::get_queue_metrics(env.clone());
    assert!(metrics.is_ok());
    
    // Unpause and test that mutations work again
    QuestLedgerV2::unpause(env.clone(), admin.clone()).unwrap();
    let result = QuestLedgerV2::complete_quest(env, player1, 1, 100, token);
    assert!(result.is_ok());
}

#[test]
fn test_authorization_enforcement() {
    let (env, admin, player1, _, token) = setup_contract();
    let unauthorized = Address::generate(&env);
    
    // Test unauthorized operations
    let result = QuestLedgerV2::set_reward_delay(env.clone(), unauthorized.clone(), 1, 3600, symbol_short!("TEST"));
    assert_eq!(result, Err(Error::Unauthorized));
    
    let result = QuestLedgerV2::update_completion_status(env.clone(), unauthorized.clone(), 1, symbol_short!("COMPLETE"));
    assert_eq!(result, Err(Error::Unauthorized));
    
    let result = QuestLedgerV2::pause(env.clone(), unauthorized.clone());
    assert_eq!(result, Err(Error::Unauthorized));
    
    // Test that admin can perform operations
    QuestLedgerV2::complete_quest(env.clone(), player1, 1, 100, token).unwrap();
    let result = QuestLedgerV2::set_reward_delay(env, admin, 1, 3600, symbol_short!("TEST"));
    assert!(result.is_ok());
}

#[test]
fn test_invalid_input_handling() {
    let (env, admin, player1, _, token) = setup_contract();
    
    // Test invalid quest ID
    let result = QuestLedgerV2::complete_quest(env.clone(), player1.clone(), 0, 100, token.clone());
    assert_eq!(result, Err(Error::InvalidAmount));
    
    // Test invalid reward amount
    let result = QuestLedgerV2::complete_quest(env.clone(), player1.clone(), 1, 0, token.clone());
    assert_eq!(result, Err(Error::InvalidAmount));
    
    let result = QuestLedgerV2::complete_quest(env.clone(), player1.clone(), 1, -100, token.clone());
    assert_eq!(result, Err(Error::InvalidAmount));
    
    // Test invalid quest ID for delay setting
    let result = QuestLedgerV2::set_reward_delay(env.clone(), admin.clone(), 0, 3600, symbol_short!("TEST"));
    assert_eq!(result, Err(Error::InvalidQuestId));
    
    // Test invalid quest ID for accessor
    let result = QuestLedgerV2::get_reward_delay_accessor(env.clone(), 0);
    assert_eq!(result, Err(Error::InvalidQuestId));
    
    // Test duplicate quest completion
    QuestLedgerV2::complete_quest(env.clone(), player1.clone(), 1, 100, token.clone()).unwrap();
    let result = QuestLedgerV2::complete_quest(env, player1, 1, 200, token);
    assert_eq!(result, Err(Error::QuestAlreadyCompleted));
}

#[test]
fn test_contract_not_initialized() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    let token = Address::generate(&env);
    
    // Test operations on uninitialized contract
    let result = QuestLedgerV2::complete_quest(env.clone(), player.clone(), 1, 100, token);
    assert_eq!(result, Err(Error::NotInitialized));
    
    let result = QuestLedgerV2::get_completion_queue_snapshot(env.clone());
    assert_eq!(result, Err(Error::NotInitialized));
    
    let result = QuestLedgerV2::get_reward_delay_accessor(env.clone(), 1);
    assert_eq!(result, Err(Error::NotInitialized));
    
    let result = QuestLedgerV2::get_queue_metrics(env);
    assert_eq!(result, Err(Error::NotInitialized));
}