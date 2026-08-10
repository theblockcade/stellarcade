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

#[test]
fn test_completion_status_summary_empty() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let player = Address::generate(&env);
    let summary = client.completion_status_summary(&player);
    assert!(summary.configured);
    assert_eq!(summary.total_challenges, 0);
    assert_eq!(summary.completed_count, 0);
    assert_eq!(summary.claimed_count, 0);
    assert_eq!(summary.completion_rate_bps, 0);
}

#[test]
fn test_completion_status_summary_with_completions() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let player = Address::generate(&env);
    let ch1 = symbol_short!("ch1");
    let ch2 = symbol_short!("ch2");
    let ch3 = symbol_short!("ch3");

    client.add_challenge(&admin, &ch1, &symbol_short!("c1"), &0, &100);
    client.add_challenge(&admin, &ch2, &symbol_short!("c2"), &0, &200);
    client.add_challenge(&admin, &ch3, &symbol_short!("c3"), &0, &300);

    client.complete_challenge(&player, &ch1);
    client.complete_challenge(&player, &ch2);
    client.claim_reward(&player, &ch1);

    let summary = client.completion_status_summary(&player);
    assert_eq!(summary.total_challenges, 3);
    assert_eq!(summary.completed_count, 2);
    assert_eq!(summary.claimed_count, 1);
    assert_eq!(summary.unclaimed_count, 1);
    assert_eq!(summary.completion_rate_bps, 6_666);
}

#[test]
fn test_reset_delay_not_configured() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);

    let delay = client.reset_delay();
    assert!(!delay.configured);
    assert_eq!(delay.interval_ledgers, 0);
    assert!(!delay.reset_due);
    assert_eq!(delay.ledgers_until_reset, 0);
}

#[test]
fn test_reset_delay_configured_not_due() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    client.set_refresh_interval(&admin, &17280);
    client.record_refresh(&admin);

    let delay = client.reset_delay();
    assert!(delay.configured);
    assert_eq!(delay.interval_ledgers, 17280);
    assert!(!delay.reset_due);
    assert!(delay.ledgers_until_reset > 0);
}

#[test]
fn test_reset_delay_overdue() {
    use soroban_sdk::testutils::Ledger as _;
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    client.set_refresh_interval(&admin, &10);
    client.record_refresh(&admin);

    env.ledger().with_mut(|l| l.sequence_number = 9999);

    let delay = client.reset_delay();
    assert!(delay.configured);
    assert!(delay.reset_due);
    assert_eq!(delay.ledgers_until_reset, 0);
}
