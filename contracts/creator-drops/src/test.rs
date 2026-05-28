#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(env: &Env) -> (CreatorDropsClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let creator = Address::generate(env);
    let contract_id = env.register(CreatorDrops, ());
    let client = CreatorDropsClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, creator)
}

#[test]
fn window_snapshot_and_saturation_track_claims() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 150);

    let (client, admin, creator) = setup(&env);
    let claimer = Address::generate(&env);

    client.upsert_drop(
        &admin,
        &11,
        &DropConfigInput {
            creator: creator.clone(),
            starts_at: 100,
            ends_at: 300,
            total_supply: 10,
            paused: false,
        },
    );
    client.claim(&claimer, &11, &3);

    let snapshot = client.drop_window_snapshot(&11);
    assert!(snapshot.exists);
    assert_eq!(snapshot.state, DropWindowState::Open);
    assert_eq!(snapshot.creator, Some(creator));
    assert_eq!(snapshot.claimed_supply, 3);
    assert_eq!(snapshot.remaining_supply, 7);
    assert_eq!(snapshot.claim_count, 1);
    assert!(snapshot.can_claim);

    let saturation = client.claim_saturation(&11);
    assert_eq!(saturation.saturation_bps, 3_000);
    assert_eq!(saturation.remaining_supply, 7);
    assert!(saturation.can_claim);
}

#[test]
fn not_configured_and_missing_drop_reads_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CreatorDrops, ());
    let client = CreatorDropsClient::new(&env, &contract_id);

    let before_init = client.drop_window_snapshot(&77);
    assert!(!before_init.configured);
    assert_eq!(before_init.state, DropWindowState::NotConfigured);
    assert_eq!(before_init.creator, None);

    let admin = Address::generate(&env);
    client.init(&admin);

    let missing = client.claim_saturation(&77);
    assert!(missing.configured);
    assert!(!missing.exists);
    assert_eq!(missing.saturation_bps, 0);
    assert!(!missing.can_claim);
}
