#![cfg(test)]
use super::*;
use soroban_sdk::testutils::{Address as _};
use soroban_sdk::{Env, Vec};
use crate::types::Release;

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
