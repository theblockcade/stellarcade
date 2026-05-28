use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn create_token<'a>(env: &'a Env, admin: &Address) -> (Address, StellarAssetClient<'a>) {
    let contract = env.register_stellar_asset_contract_v2(admin.clone());
    let client = StellarAssetClient::new(env, &contract.address());
    (contract.address(), client)
}

struct Setup<'a> {
    client: JackpotPoolClient<'a>,
    admin: Address,
    token: Address,
    sac: StellarAssetClient<'a>,
}

fn setup(env: &Env, min_target: i128) -> Setup<'_> {
    let admin = Address::generate(env);
    let token_admin = Address::generate(env);
    let (token, sac) = create_token(env, &token_admin);

    let contract_id = env.register(JackpotPool, ());
    let client = JackpotPoolClient::new(env, &contract_id);

    env.mock_all_auths();
    client.init(&admin, &token, &min_target);

    Setup {
        client,
        admin,
        token,
        sac,
    }
}

fn tc<'a>(env: &'a Env, token: &Address) -> TokenClient<'a> {
    TokenClient::new(env, token)
}

// ---------------------------------------------------------------------------
// Empty pool
// ---------------------------------------------------------------------------

#[test]
fn test_contributor_breakdown_empty_pool() {
    let env = Env::default();
    let s = setup(&env, 1_000i128);

    let summary = s.client.contributor_breakdown();
    assert_eq!(summary.total_contributed, 0);
    assert_eq!(summary.contributor_count, 0);
    assert_eq!(summary.top_contributor_share_bps, 0);
}

#[test]
fn test_funding_snapshot_empty_pool() {
    let env = Env::default();
    let s = setup(&env, 1_000i128);

    let snap = s.client.funding_snapshot();
    assert_eq!(snap.minimum_target, 1_000);
    assert_eq!(snap.current_funded, 0);
    assert_eq!(snap.shortfall, 1_000);
    assert!(!snap.is_funded);
}

// ---------------------------------------------------------------------------
// Partially funded pool
// ---------------------------------------------------------------------------

#[test]
fn test_funding_snapshot_partial() {
    let env = Env::default();
    let s = setup(&env, 1_000i128);
    let alice = Address::generate(&env);
    s.sac.mint(&alice, &400i128);

    s.client.contribute(&alice, &400i128);

    let snap = s.client.funding_snapshot();
    assert_eq!(snap.current_funded, 400);
    assert_eq!(snap.shortfall, 600);
    assert!(!snap.is_funded);
}

// ---------------------------------------------------------------------------
// Fully funded pool
// ---------------------------------------------------------------------------

#[test]
fn test_funding_snapshot_fully_funded() {
    let env = Env::default();
    let s = setup(&env, 1_000i128);
    let alice = Address::generate(&env);
    s.sac.mint(&alice, &1_000i128);

    s.client.contribute(&alice, &1_000i128);

    let snap = s.client.funding_snapshot();
    assert_eq!(snap.current_funded, 1_000);
    assert_eq!(snap.shortfall, 0);
    assert!(snap.is_funded);
}

// ---------------------------------------------------------------------------
// Multi-contributor breakdown and share calculation
// ---------------------------------------------------------------------------

#[test]
fn test_contributor_breakdown_multi() {
    let env = Env::default();
    let s = setup(&env, 1_000i128);

    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    s.sac.mint(&alice, &600i128);
    s.sac.mint(&bob, &300i128);
    s.sac.mint(&carol, &100i128);

    s.client.contribute(&alice, &600i128);
    s.client.contribute(&bob, &300i128);
    s.client.contribute(&carol, &100i128);

    let summary = s.client.contributor_breakdown();
    assert_eq!(summary.total_contributed, 1_000);
    assert_eq!(summary.contributor_count, 3);
    // Alice contributed 600/1000 = 60% = 6_000 bps
    assert_eq!(summary.top_contributor_share_bps, 6_000);
}

// ---------------------------------------------------------------------------
// Post-payout reset
// ---------------------------------------------------------------------------

#[test]
fn test_snapshots_after_round_reset() {
    let env = Env::default();
    let s = setup(&env, 500i128);
    let alice = Address::generate(&env);
    s.sac.mint(&alice, &600i128);

    s.client.contribute(&alice, &600i128);

    // Sanity check before reset
    let snap_before = s.client.funding_snapshot();
    assert!(snap_before.is_funded);

    s.client.reset_round(&s.admin);

    // After reset the counters should be zeroed
    let summary = s.client.contributor_breakdown();
    assert_eq!(summary.total_contributed, 0);
    assert_eq!(summary.contributor_count, 0);
    assert_eq!(summary.top_contributor_share_bps, 0);

    let snap_after = s.client.funding_snapshot();
    assert_eq!(snap_after.current_funded, 0);
    assert_eq!(snap_after.shortfall, 500);
    assert!(!snap_after.is_funded);
}

// ---------------------------------------------------------------------------
// Contributor count uniqueness
// ---------------------------------------------------------------------------

#[test]
fn test_contributor_count_increments_once_per_address() {
    let env = Env::default();
    let s = setup(&env, 1_000i128);
    let alice = Address::generate(&env);
    s.sac.mint(&alice, &400i128);

    s.client.contribute(&alice, &200i128);
    s.client.contribute(&alice, &200i128);

    let summary = s.client.contributor_breakdown();
    assert_eq!(summary.contributor_count, 1); // Alice counted once
    assert_eq!(summary.total_contributed, 400);
    // Alice's cumulative share = 400/400 = 100% = 10_000 bps
    assert_eq!(summary.top_contributor_share_bps, 10_000);
}
