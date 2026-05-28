use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup_client(env: &Env) -> (LendingPoolClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register_contract(None, LendingPool);
    let client = LendingPoolClient::new(env, &contract_id);
    client.init(&admin, &900);
    (client, admin)
}

#[test]
fn test_utilization_and_buffer_happy_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup_client(&env);

    client.set_pool_totals(&admin, &1_000, &250);
    let utilization = client.utilization_snapshot();
    assert!(utilization.configured);
    assert_eq!(utilization.available_liquidity, 750);
    assert_eq!(utilization.utilization_bps, 2_500);

    let buffer = client.liquidation_buffer_snapshot();
    assert_eq!(buffer.liquidation_buffer_bps, 900);
    assert!(buffer.has_borrow_exposure);
}

#[test]
fn test_unconfigured_returns_predictable_zero_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, LendingPool);
    let client = LendingPoolClient::new(&env, &contract_id);

    let utilization = client.utilization_snapshot();
    assert!(!utilization.configured);
    assert_eq!(utilization.total_supplied, 0);
    assert_eq!(utilization.utilization_bps, 0);

    let buffer = client.liquidation_buffer_snapshot();
    assert!(!buffer.configured);
    assert_eq!(buffer.liquidation_buffer_bps, 0);
    assert!(!buffer.has_borrow_exposure);
}
