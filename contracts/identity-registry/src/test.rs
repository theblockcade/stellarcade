use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn sample_string(env: &Env, value: &str) -> String {
    String::from_str(env, value)
}

fn setup_client(env: &Env) -> (IdentityRegistryClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let user = Address::generate(env);
    let contract_id = env.register_contract(None, IdentityRegistry);
    let client = IdentityRegistryClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, user)
}

#[test]
fn test_profile_completeness_for_complete_identity() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, user) = setup_client(&env);

    client.register_identity(
        &user,
        &Some(sample_string(&env, "Arcade Ace")),
        &Some(sample_string(&env, "NG")),
        &Some(sample_string(&env, "High score hunter")),
        &Some(sample_string(&env, "ipfs://avatar")),
    );
    client.set_verification_state(&user, &true, &true, &true, &true);

    let completeness = client.profile_completeness(&user);
    assert!(completeness.exists);
    assert_eq!(completeness.score_bps, 10_000);
    assert_eq!(completeness.completed_fields, 4);

    let summary = client.verification_summary(&user);
    assert!(summary.is_fully_verified);
    assert_eq!(summary.completed_dimensions, 4);
    assert_eq!(summary.pending_requirements.len(), 0);
}

#[test]
fn test_profile_completeness_for_partial_identity() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, user) = setup_client(&env);

    client.register_identity(
        &user,
        &Some(sample_string(&env, "Arcade Ace")),
        &None,
        &Some(sample_string(&env, "Still onboarding")),
        &None,
    );
    client.set_verification_state(&user, &true, &false, &false, &true);

    let completeness = client.profile_completeness(&user);
    assert!(completeness.exists);
    assert_eq!(completeness.completed_fields, 2);
    assert_eq!(completeness.total_fields, 4);
    assert_eq!(completeness.score_bps, 5_000);
    assert!(completeness.has_display_name);
    assert!(!completeness.has_country_code);
    assert!(completeness.has_bio);
    assert!(!completeness.has_avatar_uri);

    let summary = client.verification_summary(&user);
    assert_eq!(summary.completed_dimensions, 2);
    assert_eq!(summary.total_dimensions, 4);
    assert!(!summary.is_fully_verified);
    assert_eq!(summary.pending_requirements.len(), 2);
}

#[test]
fn test_unknown_identity_returns_empty_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _user) = setup_client(&env);
    let unknown = Address::generate(&env);

    let completeness = client.profile_completeness(&unknown);
    assert!(!completeness.exists);
    assert_eq!(completeness.score_bps, 0);
    assert_eq!(completeness.completed_fields, 0);

    let summary = client.verification_summary(&unknown);
    assert!(!summary.exists);
    assert_eq!(summary.completed_dimensions, 0);
    assert_eq!(summary.total_dimensions, 4);
    assert_eq!(summary.pending_requirements.len(), 4);
}

// ── status_verification_snapshot ─────────────────────────────────────────────

#[test]
fn test_status_snapshot_fully_verified() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, user) = setup_client(&env);

    client.register_identity(
        &user,
        &Some(sample_string(&env, "Player One")),
        &Some(sample_string(&env, "US")),
        &Some(sample_string(&env, "bio")),
        &Some(sample_string(&env, "ipfs://avatar")),
    );
    client.set_verification_state(&user, &true, &true, &true, &true);

    let snap = client.status_verification_snapshot(&user);
    assert!(snap.configured);
    assert!(snap.exists);
    assert!(snap.is_fully_verified);
    assert_eq!(snap.completed_dimensions, 4);
    assert_eq!(snap.score_bps, 10_000);
}

#[test]
fn test_status_snapshot_partial_verification() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, user) = setup_client(&env);

    client.register_identity(&user, &None, &None, &None, &None);
    client.set_verification_state(&user, &true, &false, &false, &true);

    let snap = client.status_verification_snapshot(&user);
    assert!(snap.exists);
    assert!(!snap.is_fully_verified);
    assert_eq!(snap.completed_dimensions, 2);
    assert_eq!(snap.score_bps, 5_000);
    assert!(snap.email_verified);
    assert!(!snap.phone_verified);
}

#[test]
fn test_status_snapshot_unknown_identity_returns_zeroed() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _user) = setup_client(&env);
    let unknown = Address::generate(&env);

    let snap = client.status_verification_snapshot(&unknown);
    assert!(snap.configured);
    assert!(!snap.exists);
    assert!(!snap.is_fully_verified);
    assert_eq!(snap.score_bps, 0);
    assert_eq!(snap.completed_dimensions, 0);
}

// ── renewal_window_accessor ───────────────────────────────────────────────────

#[test]
fn test_renewal_window_accessor_active_not_in_window() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, user) = setup_client(&env);

    client.register_identity(
        &user,
        &Some(sample_string(&env, "Gamer")),
        &Some(sample_string(&env, "NG")),
        &None,
        &None,
    );
    client.set_verification_state(&user, &true, &true, &true, &true);

    // ledger 0, expires at ledger 1000, renewal window = 100 ledgers
    let window = client.renewal_window_accessor(&user, &1000u32, &100u32);
    assert!(window.configured);
    assert!(window.exists);
    assert!(!window.is_expired);
    assert!(!window.in_renewal_window); // current_ledger 0 < renewal_window_start 900
    assert_eq!(window.renewal_window_start, 900);
    assert_eq!(window.ledgers_until_expiry, 1000);
}

#[test]
fn test_renewal_window_accessor_inside_renewal_window() {
    let env = Env::default();
    env.mock_all_auths();
    // Simulate current ledger near expiry by registering and using a small expiry
    let (client, _admin, user) = setup_client(&env);

    client.register_identity(&user, &None, &None, &None, &None);
    client.set_verification_state(&user, &true, &true, &true, &true);

    // ledger 0, expires at 50, renewal window = 100 → window_start = 0
    // current_ledger(0) >= renewal_window_start(0) and not expired → in window
    let window = client.renewal_window_accessor(&user, &50u32, &100u32);
    assert!(window.exists);
    assert!(!window.is_expired);
    assert!(window.in_renewal_window);
    assert_eq!(window.ledgers_until_expiry, 50);
}

#[test]
fn test_renewal_window_accessor_unknown_identity() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _user) = setup_client(&env);
    let unknown = Address::generate(&env);

    let window = client.renewal_window_accessor(&unknown, &500u32, &50u32);
    assert!(window.configured);
    assert!(!window.exists);
    assert!(!window.in_renewal_window);
    assert!(!window.is_expired);
    assert_eq!(window.ledgers_until_expiry, 0);
}
