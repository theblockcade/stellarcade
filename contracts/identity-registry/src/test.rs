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
