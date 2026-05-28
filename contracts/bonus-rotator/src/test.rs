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
