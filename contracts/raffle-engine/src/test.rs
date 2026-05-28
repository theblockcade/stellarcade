use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup_client(env: &Env) -> (RaffleEngineClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register_contract(None, RaffleEngine);
    let client = RaffleEngineClient::new(env, &contract_id);
    client.init(&admin, &10);
    (client, admin)
}

#[test]
fn test_distribution_and_readiness_happy_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup_client(&env);

    client.upsert_round(&admin, &42, &20, &6, &10, &6, &4, &true);

    let summary = client.ticket_distribution_summary(&42);
    assert!(summary.exists);
    assert_eq!(summary.common_tickets, 10);
    assert_eq!(summary.total_tickets, 20);

    let readiness = client.draw_readiness(&42);
    assert!(readiness.ready);
    assert_eq!(readiness.blocker, None);
}

#[test]
fn test_missing_round_returns_predictable_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin) = setup_client(&env);

    let summary = client.ticket_distribution_summary(&404);
    assert!(!summary.exists);
    assert_eq!(summary.total_tickets, 0);

    let readiness = client.draw_readiness(&404);
    assert!(!readiness.exists);
    assert_eq!(
        readiness.blocker,
        Some(String::from_str(&env, "missing_round"))
    );
}
