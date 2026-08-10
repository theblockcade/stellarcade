extern crate std;

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{BonusRotator, BonusRotatorClient};

#[test]
fn cycle_snapshot_and_rollover_success_path() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(BonusRotator, ());
    let client = BonusRotatorClient::new(&env, &id);
    env.mock_all_auths();

    client.init(&admin);
    client.set_active_cycle(&admin, &5, &1250, &100, &600);
    let snap = client.active_bonus_cycle_snapshot();
    assert!(snap.has_active_cycle);
    assert_eq!(snap.cycle_id, 5);
    assert_eq!(client.next_rollover_at(), 600);
}

#[test]
fn empty_cycle_returns_zero_rollover() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(BonusRotator, ());
    let client = BonusRotatorClient::new(&env, &id);
    env.mock_all_auths();
    client.init(&admin);

    let snap = client.active_bonus_cycle_snapshot();
    assert!(!snap.has_active_cycle);
    assert_eq!(client.next_rollover_at(), 0);
}

#[test]
fn rotator_status_summary_with_active_cycle() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(BonusRotator, ());
    let client = BonusRotatorClient::new(&env, &id);
    env.mock_all_auths();

    client.init(&admin);
    client.set_active_cycle(&admin, &3, &500, &200, &800);
    let summary = client.rotator_status_summary();
    assert!(summary.is_configured);
    assert!(!summary.is_paused);
    assert_eq!(summary.active_cycle_id, 3);
    assert_eq!(summary.bonus_bps, 500);
    assert_eq!(summary.cycle_ends_at, 800);
}

#[test]
fn rotator_status_summary_unconfigured_state() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(BonusRotator, ());
    let client = BonusRotatorClient::new(&env, &id);
    env.mock_all_auths();
    client.init(&admin);

    let summary = client.rotator_status_summary();
    assert!(!summary.is_configured);
    assert_eq!(summary.active_cycle_id, 0);
    assert_eq!(summary.bonus_bps, 0);
}

#[test]
fn cycle_delay_with_future_end() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(BonusRotator, ());
    let client = BonusRotatorClient::new(&env, &id);
    env.mock_all_auths();

    client.init(&admin);
    // ledger timestamp defaults to 0 in test env; ends_at=1000 → 1000s remaining
    client.set_active_cycle(&admin, &1, &100, &0, &1000);
    let delay = client.cycle_delay();
    assert!(delay.has_active_cycle);
    assert_eq!(delay.seconds_until_end, 1000);
}

#[test]
fn cycle_delay_no_cycle_returns_zero() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(BonusRotator, ());
    let client = BonusRotatorClient::new(&env, &id);
    env.mock_all_auths();
    client.init(&admin);

    let delay = client.cycle_delay();
    assert!(!delay.has_active_cycle);
    assert_eq!(delay.seconds_until_end, 0);
}
