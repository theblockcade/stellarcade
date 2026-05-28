use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup_client(env: &Env) -> (LootCrateClient<'_>, Address) {
    let admin = Address::generate(env);
    let contract_id = env.register_contract(None, LootCrate);
    let client = LootCrateClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin)
}

#[test]
fn test_availability_and_rarity_distribution_happy_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup_client(&env);

    client.upsert_crate(&admin, &7, &100, &25, &false, &60, &25, &10, &5);

    let availability = client.crate_availability_snapshot(&7);
    assert!(availability.exists);
    assert_eq!(availability.state, CrateAvailabilityState::Available);
    assert_eq!(availability.remaining_supply, 75);

    let rarity = client.rarity_distribution_snapshot(&7);
    assert!(rarity.exists);
    assert_eq!(rarity.common_bps, 6_000);
    assert_eq!(rarity.legendary_bps, 500);
}

#[test]
fn test_missing_crate_returns_empty_snapshot() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin) = setup_client(&env);

    let availability = client.crate_availability_snapshot(&404);
    assert!(!availability.exists);
    assert_eq!(availability.state, CrateAvailabilityState::Missing);

    let rarity = client.rarity_distribution_snapshot(&404);
    assert!(!rarity.exists);
    assert_eq!(rarity.common_bps, 0);
}
