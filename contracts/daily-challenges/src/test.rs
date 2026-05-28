#![cfg(test)]
use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (DailyChallengesContractClient<'_>, Address) {
    let admin = Address::generate(env);
    let id = env.register(DailyChallengesContract, ());
    let client = DailyChallengesContractClient::new(env, &id);
    client.init(&admin);
    (client, admin)
}

#[test]
fn test_completion_snapshot_empty_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let snap = client.completion_snapshot(&symbol_short!("ch1"), &Address::generate(&env));
    assert!(!snap.exists);
    assert!(!snap.completed);
    assert!(!snap.claimed);
    assert_eq!(snap.completed_at, 0);
}

#[test]
fn test_complete_and_snapshot() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let ch = symbol_short!("run5k");
    let player = Address::generate(&env);
    client.add_challenge(&admin, &ch, &symbol_short!("Run5k"), &0, &100);
    client.complete_challenge(&player, &ch);

    let snap = client.completion_snapshot(&ch, &player);
    assert!(snap.exists);
    assert!(snap.completed);
    assert!(!snap.claimed);
}

#[test]
fn test_claim_reward() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let ch = symbol_short!("quiz");
    let player = Address::generate(&env);
    client.add_challenge(&admin, &ch, &symbol_short!("Quiz"), &0, &250);
    client.complete_challenge(&player, &ch);
    let reward = client.claim_reward(&player, &ch);
    assert_eq!(reward, 250);

    // Snapshot should show claimed
    let snap = client.completion_snapshot(&ch, &player);
    assert!(snap.claimed);
}

#[test]
fn test_refresh_window_not_configured() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let info = client.refresh_window();
    assert!(!info.configured);
}

#[test]
fn test_refresh_window_configured() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    client.set_refresh_interval(&admin, &17280); // ~1 day
    client.record_refresh(&admin);

    let info = client.refresh_window();
    assert!(info.configured);
    assert_eq!(info.interval_ledgers, 17280);
    assert!(!info.overdue);
    assert!(info.ledgers_until_refresh > 0);
}
