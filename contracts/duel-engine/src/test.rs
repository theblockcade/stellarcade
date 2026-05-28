extern crate std;

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{DuelEngine, DuelEngineClient};

#[test]
fn open_summary_and_resolution_ready_path() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(DuelEngine, ());
    let client = DuelEngineClient::new(&env, &id);
    env.mock_all_auths();

    client.init(&admin);
    client.create_duel(&admin, &10);
    client.create_duel(&admin, &11);
    let summary = client.open_duel_summary();
    assert_eq!(summary.open_count, 2);
    assert_eq!(summary.oldest_open_duel_id, 10);
    assert_eq!(summary.newest_open_duel_id, 11);
    assert!(client.resolution_readiness(&10).is_ready_to_resolve);
}

#[test]
fn missing_duel_readiness_is_stable() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(DuelEngine, ());
    let client = DuelEngineClient::new(&env, &id);
    env.mock_all_auths();
    client.init(&admin);

    let readiness = client.resolution_readiness(&404);
    assert!(!readiness.exists);
    assert!(!readiness.is_ready_to_resolve);
}
