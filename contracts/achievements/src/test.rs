#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Env as _};
use soroban_sdk::{vec, Address, Env, String};

#[test]
fn test_get_category_completion_summary() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let user = Address::generate(&env);
    let ach1 = Achievement {
        id: 1,
        category: String::from_str(&env, "combat"),
        title: String::from_str(&env, "First Win"),
        unlocked: true,
    };
    let ach2 = Achievement {
        id: 2,
        category: String::from_str(&env, "combat"),
        title: String::from_str(&env, "Second Win"),
        unlocked: false,
    };
    client.add_achievement(&user, &ach1);
    client.add_achievement(&user, &ach2);

    let summary = client.get_category_completion_summary(&user, &String::from_str(&env, "combat"));
    assert_eq!(summary.total_achievements, 2);
    assert_eq!(summary.unlocked_achievements, 1);
    assert_eq!(summary.completion_percentage, 50);
}

#[test]
fn test_get_next_unlock_none() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let user = Address::generate(&env);
    let unlock = client.get_next_unlock(&user);
    assert!(unlock.is_none());
}

#[test]
fn test_get_achievement_unlock_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let user = Address::generate(&env);
    let ach1 = Achievement {
        id: 1,
        category: String::from_str(&env, "combat"),
        title: String::from_str(&env, "First Win"),
        unlocked: true,
    };
    let ach2 = Achievement {
        id: 2,
        category: String::from_str(&env, "combat"),
        title: String::from_str(&env, "Second Win"),
        unlocked: false,
    };
    let ach3 = Achievement {
        id: 3,
        category: String::from_str(&env, "exploration"),
        title: String::from_str(&env, "Explorer"),
        unlocked: true,
    };
    client.add_achievement(&user, &ach1);
    client.add_achievement(&user, &ach2);
    client.add_achievement(&user, &ach3);

    let snapshot = client.get_achievement_unlock_snapshot(&user);
    assert_eq!(snapshot.total_achievements, 3);
    assert_eq!(snapshot.unlocked_achievements, 2);
    assert_eq!(snapshot.locked_achievements, 1);
    assert_eq!(snapshot.completion_percentage, 66);
}

#[test]
fn test_get_achievement_unlock_snapshot_empty() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let user = Address::generate(&env);
    let snapshot = client.get_achievement_unlock_snapshot(&user);
    assert_eq!(snapshot.total_achievements, 0);
    assert_eq!(snapshot.unlocked_achievements, 0);
    assert_eq!(snapshot.locked_achievements, 0);
    assert_eq!(snapshot.completion_percentage, 0);
}

#[test]
fn test_get_claim_grace_accessor() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let user = Address::generate(&env);
    let current_ledger = env.ledger().sequence() as u32;
    let grace_ledger = current_ledger + 100;
    client.set_claim_grace_period(&user, &grace_ledger);

    let accessor = client.get_claim_grace_accessor(&user);
    assert_eq!(accessor.grace_period_ledger, grace_ledger);
    assert!(accessor.is_within_grace_period);
    assert!(accessor.ledgers_remaining > 0);
}

#[test]
fn test_get_claim_grace_accessor_expired() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let user = Address::generate(&env);
    let current_ledger = env.ledger().sequence() as u32;
    let grace_ledger = current_ledger - 10; // Already expired
    client.set_claim_grace_period(&user, &grace_ledger);

    let accessor = client.get_claim_grace_accessor(&user);
    assert!(!accessor.is_within_grace_period);
    assert_eq!(accessor.ledgers_remaining, 0);
}

#[test]
fn test_get_claim_grace_accessor_not_set() {
    let env = Env::default();
    let contract_id = env.register_contract(None, AchievementsContract);
    let client = AchievementsContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    client.initialize(&admin);

    let user = Address::generate(&env);
    let accessor = client.get_claim_grace_accessor(&user);
    assert_eq!(accessor.grace_period_ledger, 0);
    assert!(!accessor.is_within_grace_period);
    assert_eq!(accessor.ledgers_remaining, 0);
}