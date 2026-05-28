#![cfg(test)]
use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (SquadRosterContractClient<'_>, Address) {
    let admin = Address::generate(env);
    let id = env.register(SquadRosterContract, ());
    let client = SquadRosterContractClient::new(env, &id);
    client.init(&admin);
    (client, admin)
}

#[test]
fn test_lineup_readiness_empty_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin) = setup(&env);

    let summary = client.lineup_readiness_summary();
    assert_eq!(summary.total_slots, 0);
    assert_eq!(summary.filled_slots, 0);
    assert_eq!(summary.vacant_slots, 0);
    assert!(!summary.ready, "empty roster must not be ready");
}

#[test]
fn test_lineup_readiness_all_filled() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let cap = symbol_short!("captain");
    let sup = symbol_short!("support");
    client.add_slot(&admin, &cap);
    client.add_slot(&admin, &sup);

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    client.assign_player(&admin, &cap, &p1);
    client.assign_player(&admin, &sup, &p2);

    let summary = client.lineup_readiness_summary();
    assert_eq!(summary.total_slots, 2);
    assert_eq!(summary.filled_slots, 2);
    assert_eq!(summary.vacant_slots, 0);
    assert_eq!(summary.locked_slots, 0);
    assert!(summary.ready);
}

#[test]
fn test_lineup_readiness_locked_slot_not_ready() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let role = symbol_short!("tank");
    client.add_slot(&admin, &role);
    client.assign_player(&admin, &role, &Address::generate(&env));
    client.set_lock(&admin, &role, &true);

    let summary = client.lineup_readiness_summary();
    assert!(!summary.ready, "locked slot prevents ready=true");
    assert_eq!(summary.locked_slots, 1);
}

#[test]
fn test_vacancy_for_role_not_found() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin) = setup(&env);

    let vacancy = client.vacancy_for_role(&symbol_short!("ghost"));
    assert!(!vacancy.exists);
    assert!(!vacancy.vacant);
}

#[test]
fn test_vacancy_for_role_vacant_and_filled() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);

    let role = symbol_short!("healer");
    client.add_slot(&admin, &role);

    let v1 = client.vacancy_for_role(&role);
    assert!(v1.exists);
    assert!(v1.vacant);

    let player = Address::generate(&env);
    client.assign_player(&admin, &role, &player);

    let v2 = client.vacancy_for_role(&role);
    assert!(v2.exists);
    assert!(!v2.vacant);
    assert_eq!(v2.player, Some(player));
}
