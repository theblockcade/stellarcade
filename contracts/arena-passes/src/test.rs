extern crate std;

use soroban_sdk::{testutils::Address as _, vec, Address, Env};

use crate::{ArenaPasses, ArenaPassesClient, PassHolder};

fn setup() -> (Env, Address, soroban_sdk::Address, ArenaPassesClient<'static>) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(ArenaPasses, ());
    let client = ArenaPassesClient::new(&env, &id);
    env.mock_all_auths();
    client.init(&admin);
    (env, admin, id, client)
}

#[test]
fn holder_usage_snapshot_success_path() {
    let (env, admin, _id, client) = setup();
    // ledger timestamp = 0; expires_at = 1000 → active
    let holders = vec![
        &env,
        PassHolder { holder_index: 0, uses_remaining: 5, issued_at: 0, expires_at: 1000 },
        PassHolder { holder_index: 1, uses_remaining: 3, issued_at: 0, expires_at: 1000 },
    ];
    client.issue_passes(&admin, &holders);
    client.use_pass(&0);

    let snap = client.holder_usage_snapshot();
    assert_eq!(snap.total_holders, 2);
    assert_eq!(snap.active_holders, 2);
    assert_eq!(snap.expired_holders, 0);
    assert_eq!(snap.total_uses_remaining, 7); // 4 + 3
}

#[test]
fn holder_usage_snapshot_empty_state() {
    let (_env, _admin, _id, client) = setup();
    let snap = client.holder_usage_snapshot();
    assert_eq!(snap.total_holders, 0);
    assert_eq!(snap.active_holders, 0);
    assert_eq!(snap.total_uses_remaining, 0);
}

#[test]
fn renewal_window_within_24h_of_expiry() {
    let (env, admin, _id, client) = setup();
    // expires_at = 3600 (1h away); 3600 < 86400 → in renewal window
    let holders = vec![
        &env,
        PassHolder { holder_index: 7, uses_remaining: 2, issued_at: 0, expires_at: 3600 },
    ];
    client.issue_passes(&admin, &holders);

    let rw = client.renewal_window(&7);
    assert!(rw.is_found);
    assert!(rw.in_renewal_window);
    assert_eq!(rw.seconds_until_expiry, 3600);
}

#[test]
fn renewal_window_not_found_for_unknown_holder() {
    let (_env, _admin, _id, client) = setup();
    let rw = client.renewal_window(&99);
    assert!(!rw.is_found);
    assert!(!rw.in_renewal_window);
    assert_eq!(rw.seconds_until_expiry, 0);
}
