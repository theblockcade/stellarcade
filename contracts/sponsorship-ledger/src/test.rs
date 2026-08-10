#![cfg(test)]
use super::*;
use crate::types::Release;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Env, Vec};

#[test]
fn test_get_commitment_success() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    client.update_commitment(&partner, &1000, &true);

    let commitment = client.get_partner_commitment(&partner);
    assert_eq!(commitment.total_amount, 1000);
    assert_eq!(commitment.remaining_amount, 1000);
    assert_eq!(commitment.is_active, true);
    assert_eq!(commitment.partner, partner);
}

#[test]
fn test_get_commitment_paused() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    client.update_commitment(&partner, &1000, &true);
    client.set_paused(&partner, &true);

    let commitment = client.get_partner_commitment(&partner);
    assert_eq!(commitment.is_paused, true);
}

#[test]
fn test_get_commitment_missing() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    let commitment = client.get_partner_commitment(&partner);

    assert_eq!(commitment.total_amount, 0);
    assert_eq!(commitment.is_active, false);
    assert_eq!(commitment.partner, partner);
}

#[test]
fn test_get_schedule_success() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    let mut releases = Vec::new(&env);
    releases.push_back(Release {
        timestamp: 100,
        amount: 500,
        is_processed: false,
    });
    releases.push_back(Release {
        timestamp: 200,
        amount: 500,
        is_processed: false,
    });

    client.set_release_schedule(&partner, &releases);

    let schedule = client.get_release_schedule(&partner);
    assert_eq!(schedule.releases.len(), 2);
    assert_eq!(schedule.total_scheduled, 1000);
    assert_eq!(schedule.partner, partner);
}

#[test]
fn test_get_schedule_missing() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    let schedule = client.get_release_schedule(&partner);

    assert_eq!(schedule.releases.len(), 0);
    assert_eq!(schedule.total_scheduled, 0);
    assert_eq!(schedule.partner, partner);
}

// ── ledger_balance_summary ───────────────────────────────────────────────────

#[test]
fn test_ledger_balance_summary_success() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    client.update_commitment(&partner, &2000, &true);

    let summary = client.ledger_balance_summary(&partner);
    assert!(summary.exists);
    assert_eq!(summary.total_amount, 2000);
    assert_eq!(summary.remaining_amount, 2000);
    assert_eq!(summary.released_amount, 0);
    assert_eq!(summary.release_pct, 0);
    assert!(summary.is_active);
    assert!(!summary.is_paused);
}

#[test]
fn test_ledger_balance_summary_missing() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    let summary = client.ledger_balance_summary(&partner);

    assert!(!summary.exists);
    assert_eq!(summary.total_amount, 0);
    assert_eq!(summary.release_pct, 0);
    assert!(!summary.is_active);
}

#[test]
fn test_ledger_balance_summary_paused() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    client.update_commitment(&partner, &1000, &true);
    client.set_paused(&partner, &true);

    let summary = client.ledger_balance_summary(&partner);
    assert!(summary.is_paused);
    assert!(summary.is_active);
}

// ── revocation_window ────────────────────────────────────────────────────────

#[test]
fn test_revocation_window_with_pending_releases() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    client.update_commitment(&partner, &1000, &true);

    let mut releases = Vec::new(&env);
    releases.push_back(Release {
        timestamp: 100,
        amount: 300,
        is_processed: true,
    });
    releases.push_back(Release {
        timestamp: 200,
        amount: 400,
        is_processed: false,
    });
    releases.push_back(Release {
        timestamp: 300,
        amount: 300,
        is_processed: false,
    });
    client.set_release_schedule(&partner, &releases);

    let window = client.revocation_window(&partner);
    assert!(window.exists);
    assert!(window.can_revoke);
    assert_eq!(window.pending_release_count, 2);
    assert_eq!(window.processed_release_count, 1);
}

#[test]
fn test_revocation_window_missing_partner() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    let window = client.revocation_window(&partner);

    assert!(!window.exists);
    assert!(!window.can_revoke);
    assert_eq!(window.pending_release_count, 0);
}

#[test]
fn test_revocation_window_paused_cannot_revoke() {
    let env = Env::default();
    let contract_id = env.register_contract(None, SponsorshipLedger);
    let client = SponsorshipLedgerClient::new(&env, &contract_id);

    let partner = Address::generate(&env);
    client.update_commitment(&partner, &500, &true);
    client.set_paused(&partner, &true);

    let mut releases = Vec::new(&env);
    releases.push_back(Release {
        timestamp: 100,
        amount: 500,
        is_processed: false,
    });
    client.set_release_schedule(&partner, &releases);

    let window = client.revocation_window(&partner);
    assert!(window.exists);
    assert!(!window.can_revoke);
    assert!(window.is_paused);
}
