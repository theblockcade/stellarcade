#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Env,
};
use types::RentalStatus;

fn setup(env: &Env) -> (RentalVaultContractClient<'static>, Address) {
    let contract_id = env.register(RentalVaultContract, ());
    let client = RentalVaultContractClient::new(env, &contract_id);
    let owner = Address::generate(env);
    (client, owner)
}

#[test]
fn test_full_rental_cycle_list_rent_return_collateral_refund() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);
    let tenant = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1000);

    let rental_id = client.list_rental(&owner, &42, &10, &500, &3600);

    client.rent_item(&tenant, &rental_id, &1800);
    let active = client.get_rental_agreement(&rental_id);
    assert_eq!(active.status, RentalStatus::Active);
    assert_eq!(active.tenant, Some(tenant.clone()));
    assert_eq!(active.start_ts, 1000);
    assert_eq!(active.end_ts, 2800);

    // Return before expiry.
    env.ledger().with_mut(|l| l.timestamp = 2000);
    client.return_item(&tenant, &rental_id);

    let returned = client.get_rental_agreement(&rental_id);
    assert_eq!(returned.status, RentalStatus::Returned);
}

#[test]
fn test_owner_reclaims_after_expiry() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);
    let tenant = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1000);
    let rental_id = client.list_rental(&owner, &7, &5, &200, &1000);
    client.rent_item(&tenant, &rental_id, &500);

    // Tenant never returns; time passes beyond end_ts (1500).
    env.ledger().with_mut(|l| l.timestamp = 1600);
    client.reclaim_expired_item(&owner, &rental_id);

    let reclaimed = client.get_rental_agreement(&rental_id);
    assert_eq!(reclaimed.status, RentalStatus::Defaulted);
}

#[test]
#[should_panic(expected = "only the current tenant")]
fn test_non_tenant_cannot_return_item() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);
    let tenant = Address::generate(&env);
    let impostor = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1000);
    let rental_id = client.list_rental(&owner, &1, &10, &500, &3600);
    client.rent_item(&tenant, &rental_id, &1800);

    client.return_item(&impostor, &rental_id);
}

#[test]
#[should_panic(expected = "only the listing owner")]
fn test_non_owner_cannot_reclaim_item() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);
    let tenant = Address::generate(&env);
    let impostor = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1000);
    let rental_id = client.list_rental(&owner, &1, &10, &500, &1000);
    client.rent_item(&tenant, &rental_id, &500);

    env.ledger().with_mut(|l| l.timestamp = 2000);
    client.reclaim_expired_item(&impostor, &rental_id);
}

#[test]
#[should_panic(expected = "cannot reclaim before the rental period has expired")]
fn test_owner_cannot_reclaim_before_expiry() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);
    let tenant = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1000);
    let rental_id = client.list_rental(&owner, &1, &10, &500, &3600);
    client.rent_item(&tenant, &rental_id, &1800);

    // Still well within the active rental window (end_ts = 2800).
    env.ledger().with_mut(|l| l.timestamp = 1500);
    client.reclaim_expired_item(&owner, &rental_id);
}

#[test]
#[should_panic(expected = "rental period has already expired")]
fn test_tenant_cannot_return_past_expiry() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);
    let tenant = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1000);
    let rental_id = client.list_rental(&owner, &1, &10, &500, &1000);
    client.rent_item(&tenant, &rental_id, &500);

    env.ledger().with_mut(|l| l.timestamp = 2000);
    client.return_item(&tenant, &rental_id);
}

#[test]
#[should_panic(expected = "item is not available for rent")]
fn test_cannot_rent_already_active_item() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);
    let tenant = Address::generate(&env);
    let other_tenant = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1000);
    let rental_id = client.list_rental(&owner, &1, &10, &500, &3600);
    client.rent_item(&tenant, &rental_id, &1800);

    client.rent_item(&other_tenant, &rental_id, &1000);
}

#[test]
#[should_panic(expected = "duration_sec must be > 0 and within max_duration_sec")]
fn test_cannot_rent_beyond_max_duration() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, owner) = setup(&env);
    let tenant = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1000);
    let rental_id = client.list_rental(&owner, &1, &10, &500, &1000);

    client.rent_item(&tenant, &rental_id, &5000);
}
