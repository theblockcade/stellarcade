#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

struct Setup {
    env: Env,
    client: QueueRewardsClient<'static>,
    admin: Address,
    treasury: Address,
    token: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(QueueRewards, ());
    let client = QueueRewardsClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let treasury = Address::generate(&env);
    let token = Address::generate(&env);

    // Safety: we transmute to 'static for easier use in test structure
    let client: QueueRewardsClient<'static> = unsafe { core::mem::transmute(client) };

    Setup {
        env,
        client,
        admin,
        treasury,
        token,
    }
}

#[test]
fn test_init_and_read_snapshot() {
    let s = setup();
    s.client.init(&s.admin, &s.treasury, &s.token);

    let user = Address::generate(&s.env);
    let snapshot = s.client.get_reward_snapshot(&user);

    assert!(snapshot.config.is_some());
    assert!(snapshot.user_state.is_none()); // No rewards yet
    assert_eq!(s.client.pending_balance(&user), 0);
    assert!(!s.client.is_paused());
}

#[test]
fn test_accrue_and_read_balance() {
    let s = setup();
    s.client.init(&s.admin, &s.treasury, &s.token);

    let user = Address::generate(&s.env);
    s.client.accrue_reward(&user, &100);

    assert_eq!(s.client.pending_balance(&user), 100);

    let snapshot = s.client.get_reward_snapshot(&user);
    assert_eq!(snapshot.user_state.unwrap().total_accrued, 100);
}

#[test]
fn test_paused_state() {
    let s = setup();
    s.client.init(&s.admin, &s.treasury, &s.token);

    s.client.set_pause(&true);
    assert!(s.client.is_paused());

    let user = Address::generate(&s.env);
    let result = s.client.try_accrue_reward(&user, &100);
    assert!(result.is_err());
}

#[test]
fn test_claim_cycle() {
    let s = setup();
    s.client.init(&s.admin, &s.treasury, &s.token);

    let user = Address::generate(&s.env);
    s.client.accrue_reward(&user, &500);
    
    assert_eq!(s.client.claim_reward(&user), 500);
    assert_eq!(s.client.pending_balance(&user), 0);

    let state = s.client.get_reward_snapshot(&user).user_state.unwrap();
    assert_eq!(state.total_claimed, 500);
}

#[test]
fn test_uninitialized_reads() {
    let env = Env::default();
    let contract_id = env.register(QueueRewards, ());
    let client = QueueRewardsClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    // Snapshot should return None for config but still return the object
    let snapshot = client.get_reward_snapshot(&user);
    assert!(snapshot.config.is_none());
    assert!(client.is_paused()); // Default to True when NOT initialized
}
