#![cfg(test)]
extern crate std;

use soroban_sdk::{testutils::Address as _, Address, Env};
use crate::{VoucherEscrow, VoucherEscrowClient};

fn setup(env: &Env) -> (VoucherEscrowClient<'_>, Address) {
    let admin = Address::generate(env);
    let id = env.register(VoucherEscrow, ());
    let client = VoucherEscrowClient::new(env, &id);
    env.mock_all_auths();
    client.init(&admin);
    (client, admin)
}

#[test]
fn reserved_voucher_summary_tracks_reserves() {
    let env = Env::default();
    let (client, admin) = setup(&env);
    let holder = Address::generate(&env);

    let vid = client.reserve(&admin, &holder, &500, &1000);
    let summary = client.reserved_voucher_summary();
    assert_eq!(summary.total_reserved, 500);
    assert_eq!(summary.active_escrow_count, 1);
    assert_eq!(summary.claimed_count, 0);

    client.claim(&holder, &vid);
    let summary2 = client.reserved_voucher_summary();
    assert_eq!(summary2.claimed_count, 1);
    assert_eq!(summary2.active_escrow_count, 0);
}

#[test]
fn expiry_pressure_unknown_id_returns_not_exists() {
    let env = Env::default();
    let (client, _) = setup(&env);
    let p = client.expiry_pressure(&999);
    assert!(!p.exists);
    assert!(!p.is_expired);
}

#[test]
fn expiry_pressure_shows_ledgers_remaining() {
    let env = Env::default();
    let (client, admin) = setup(&env);
    let holder = Address::generate(&env);
    // current ledger sequence starts at 0 in tests; expiry at 100
    let vid = client.reserve(&admin, &holder, &200, &100);
    let p = client.expiry_pressure(&vid);
    assert!(p.exists);
    assert!(!p.is_expired);
    assert!(p.ledgers_until_expiry > 0);
}

#[test]
fn reserved_voucher_summary_empty_initially() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let summary = client.reserved_voucher_summary();
    assert_eq!(summary.total_reserved, 0);
    assert_eq!(summary.active_escrow_count, 0);
    assert_eq!(summary.claimed_count, 0);
    assert_eq!(summary.expired_escrow_count, 0);
}
