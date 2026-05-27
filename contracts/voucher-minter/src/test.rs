#![cfg(test)]

use soroban_sdk::{testutils::{Address as _, Ledger as _}, Address, Env};

use super::*;

fn setup(env: &Env) -> (VoucherMinterClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register(VoucherMinter, ());
    let client = VoucherMinterClient::new(env, &contract_id);
    env.mock_all_auths();
    client.init(&admin);
    (client, admin)
}

// ---------------------------------------------------------------------------
// issuance_summary — success path
// ---------------------------------------------------------------------------

#[test]
fn test_issuance_summary_success() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_voucher_type(&admin, &1, &1000, &false);
    client.issue_voucher(&admin, &101, &1, &5_000_000);
    client.issue_voucher(&admin, &102, &1, &5_000_000);

    let summary = client.issuance_summary(&1);
    assert!(summary.exists);
    assert_eq!(summary.voucher_type_id, 1);
    assert_eq!(summary.total_issued, 2);
    assert_eq!(summary.max_supply, 1000);
    assert_eq!(summary.remaining, 998);
    assert!(!summary.paused);
}

// ---------------------------------------------------------------------------
// issuance_summary — uncapped type
// ---------------------------------------------------------------------------

#[test]
fn test_issuance_summary_uncapped() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_voucher_type(&admin, &2, &0, &false);

    let summary = client.issuance_summary(&2);
    assert!(summary.exists);
    assert_eq!(summary.max_supply, 0);
    assert_eq!(summary.remaining, u64::MAX);
}

// ---------------------------------------------------------------------------
// issuance_summary — paused type
// ---------------------------------------------------------------------------

#[test]
fn test_issuance_summary_paused() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_voucher_type(&admin, &3, &500, &true);

    let summary = client.issuance_summary(&3);
    assert!(summary.exists);
    assert!(summary.paused);

    // Issuing against a paused type must fail
    let result = client.try_issue_voucher(&admin, &201, &3, &9_000_000);
    assert!(result.is_err());
}

// ---------------------------------------------------------------------------
// issuance_summary — missing type returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_issuance_summary_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let summary = client.issuance_summary(&999);
    assert!(!summary.exists);
    assert_eq!(summary.total_issued, 0);
    assert_eq!(summary.max_supply, 0);
    assert_eq!(summary.remaining, 0);
    assert!(!summary.paused);
}

// ---------------------------------------------------------------------------
// claim_expiry — success path (not yet expired)
// ---------------------------------------------------------------------------

#[test]
fn test_claim_expiry_not_expired() {
    let env = Env::default();
    env.ledger().set_sequence_number(100);
    let (client, admin) = setup(&env);

    client.upsert_voucher_type(&admin, &1, &0, &false);
    client.issue_voucher(&admin, &301, &1, &200);

    let expiry = client.claim_expiry(&301);
    assert!(expiry.exists);
    assert_eq!(expiry.voucher_id, 301);
    assert_eq!(expiry.expires_at_ledger, 200);
    assert!(!expiry.claimed);
    assert!(!expiry.is_expired);
}

// ---------------------------------------------------------------------------
// claim_expiry — expired voucher
// ---------------------------------------------------------------------------

#[test]
fn test_claim_expiry_expired() {
    let env = Env::default();
    env.ledger().set_sequence_number(300);
    let (client, admin) = setup(&env);

    client.upsert_voucher_type(&admin, &1, &0, &false);
    client.issue_voucher(&admin, &302, &1, &200);

    let expiry = client.claim_expiry(&302);
    assert!(expiry.exists);
    assert!(expiry.is_expired);
    assert!(!expiry.claimed);
}

// ---------------------------------------------------------------------------
// claim_expiry — claimed voucher
// ---------------------------------------------------------------------------

#[test]
fn test_claim_expiry_claimed() {
    let env = Env::default();
    env.ledger().set_sequence_number(100);
    let (client, admin) = setup(&env);

    client.upsert_voucher_type(&admin, &1, &0, &false);
    client.issue_voucher(&admin, &303, &1, &500);
    client.claim_voucher(&admin, &303);

    let expiry = client.claim_expiry(&303);
    assert!(expiry.exists);
    assert!(expiry.claimed);
    assert!(!expiry.is_expired);
}

// ---------------------------------------------------------------------------
// claim_expiry — missing voucher returns zero-state
// ---------------------------------------------------------------------------

#[test]
fn test_claim_expiry_missing() {
    let env = Env::default();
    let (client, _) = setup(&env);

    let expiry = client.claim_expiry(&9999);
    assert!(!expiry.exists);
    assert_eq!(expiry.expires_at_ledger, 0);
    assert!(!expiry.claimed);
    assert!(!expiry.is_expired);
}

// ---------------------------------------------------------------------------
// supply exhaustion guard
// ---------------------------------------------------------------------------

#[test]
fn test_supply_exhausted() {
    let env = Env::default();
    let (client, admin) = setup(&env);

    client.upsert_voucher_type(&admin, &1, &1, &false);
    client.issue_voucher(&admin, &401, &1, &1_000_000);

    let result = client.try_issue_voucher(&admin, &402, &1, &1_000_000);
    assert!(result.is_err());

    let summary = client.issuance_summary(&1);
    assert_eq!(summary.remaining, 0);
}
