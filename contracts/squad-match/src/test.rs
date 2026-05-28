#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

struct Setup {
    env: Env,
    client: SquadMatchClient<'static>,
    admin: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(SquadMatch, ());
    let client = SquadMatchClient::new(&env, &contract_id);

    let admin = Address::generate(&env);

    let client: SquadMatchClient<'static> = unsafe { core::mem::transmute(client) };

    Setup {
        env,
        client,
        admin,
    }
}

#[test]
fn test_init_and_snapshot() {
    let s = setup();
    s.client.init(&s.admin, &2, &4);

    let snapshot = s.client.get_match_snapshot(&1);
    assert!(snapshot.config.is_some());
    assert!(snapshot.match_state.is_none());
    assert!(!s.client.is_paused());
}

#[test]
fn test_create_match_and_query() {
    let s = setup();
    s.client.init(&s.admin, &2, &4);

    let user = Address::generate(&s.env);
    s.client.create_match(&101, &user);

    assert_eq!(s.client.get_match_status(&101), MatchStatus::Pending);

    let snapshot = s.client.get_match_snapshot(&101);
    assert!(snapshot.match_state.is_some());
}

#[test]
fn test_paused_system() {
    let s = setup();
    s.client.init(&s.admin, &2, &4);

    s.client.set_pause(&true);
    assert!(s.client.is_paused());

    let user = Address::generate(&s.env);
    let result = s.client.try_create_match(&102, &user);
    assert!(result.is_err());
}

#[test]
fn test_missing_match_fallback() {
    let s = setup();
    s.client.init(&s.admin, &2, &4);

    assert_eq!(s.client.get_match_status(&999), MatchStatus::Cancelled);
}

#[test]
fn test_uninitialized_reads() {
    let env = Env::default();
    let contract_id = env.register(SquadMatch, ());
    let client = SquadMatchClient::new(&env, &contract_id);

    let snapshot = client.get_match_snapshot(&1);
    assert!(snapshot.config.is_none());
    assert!(client.is_paused());
}
