#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{ComboRewardsContract, ComboRewardsContractClient};

#[test]
fn streak_combo_snapshot_and_expiry_risk_happy_path() {
    let env = Env::default();
    let id = env.register(ComboRewardsContract, ());
    let client = ComboRewardsContractClient::new(&env, &id);
    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);
    let now = env.ledger().sequence();
    client.upsert_player_snapshot(&admin, &player, &7, &14500, &(now + 250));

    let snapshot = client.get_streak_combo_snapshot(&player);
    assert!(snapshot.has_snapshot);
    assert_eq!(snapshot.streak_count, 7);
    assert_eq!(snapshot.combo_multiplier_bps, 14500);

    let risk = client.get_expiry_risk_accessor(&player);
    assert!(risk.has_snapshot);
    assert!(!risk.at_risk);
}

#[test]
fn streak_combo_snapshot_missing_state() {
    let env = Env::default();
    let id = env.register(ComboRewardsContract, ());
    let client = ComboRewardsContractClient::new(&env, &id);
    let player = Address::generate(&env);

    let snapshot = client.get_streak_combo_snapshot(&player);
    assert!(!snapshot.has_snapshot);
    assert_eq!(snapshot.streak_count, 0);

    let risk = client.get_expiry_risk_accessor(&player);
    assert!(!risk.has_snapshot);
    assert!(!risk.at_risk);
}

#[test]
fn reward_streak_summary_happy_path() {
    let env = Env::default();
    let id = env.register(ComboRewardsContract, ());
    let client = ComboRewardsContractClient::new(&env, &id);
    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);
    let now = env.ledger().sequence();
    client.upsert_player_snapshot(&admin, &player, &5, &20000, &(now + 500));

    let summary = client.reward_streak_summary(&player);
    assert!(summary.has_active_streak);
    assert_eq!(summary.streak_count, 5);
    assert_eq!(summary.combo_multiplier_bps, 20000);
    assert_eq!(summary.expires_at_ledger, now + 500);
    assert_eq!(summary.ledgers_remaining, 500);
}

#[test]
fn reward_streak_summary_missing_player() {
    let env = Env::default();
    let id = env.register(ComboRewardsContract, ());
    let client = ComboRewardsContractClient::new(&env, &id);
    let player = Address::generate(&env);

    let summary = client.reward_streak_summary(&player);
    assert!(!summary.has_active_streak);
    assert_eq!(summary.streak_count, 0);
    assert_eq!(summary.ledgers_remaining, 0);
}

#[test]
fn multiplier_decay_accessor_happy_path() {
    let env = Env::default();
    let id = env.register(ComboRewardsContract, ());
    let client = ComboRewardsContractClient::new(&env, &id);
    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    env.mock_all_auths();

    client.initialize(&admin);
    let now = env.ledger().sequence();
    // player has 8000 bps; threshold 10000 => below_threshold = true
    client.upsert_player_snapshot(&admin, &player, &3, &8000, &(now + 300));

    let accessor = client.multiplier_decay_accessor(&player, &10000u32);
    assert!(accessor.has_active_streak);
    assert_eq!(accessor.combo_multiplier_bps, 8000);
    assert_eq!(accessor.decay_threshold_bps, 10000);
    assert!(accessor.below_threshold);

    // threshold lower than multiplier => not below
    let accessor2 = client.multiplier_decay_accessor(&player, &5000u32);
    assert!(!accessor2.below_threshold);
}

#[test]
fn multiplier_decay_accessor_missing_player() {
    let env = Env::default();
    let id = env.register(ComboRewardsContract, ());
    let client = ComboRewardsContractClient::new(&env, &id);
    let player = Address::generate(&env);

    let accessor = client.multiplier_decay_accessor(&player, &1000u32);
    assert!(!accessor.has_active_streak);
    assert_eq!(accessor.combo_multiplier_bps, 0);
    // 0 < 1000 => below_threshold
    assert!(accessor.below_threshold);
}
