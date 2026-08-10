use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup_with_session(env: &Env) -> (ArenaSessionsClient<'_>, Address, u64) {
    let (client, _admin, player) = setup(env);
    let session_id = client.start_session(&player, &1, &100, &10);
    (client, player, session_id)
}

fn setup(env: &Env) -> (ArenaSessionsClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let player = Address::generate(env);
    let contract_id = env.register_contract(None, ArenaSessions);
    let client = ArenaSessionsClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, player)
}

#[test]
fn test_session_status_and_completion_happy_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, player) = setup(&env);

    let session_id = client.start_session(&player, &7, &250, &10);
    let active_status = client.session_status(&session_id);
    assert!(active_status.exists);
    assert_eq!(active_status.player, Some(player.clone()));
    assert_eq!(active_status.arena_id, 7);
    assert_eq!(active_status.stake_amount, 250);
    assert_eq!(active_status.state, ArenaSessionState::Active);
    assert!(active_status.can_complete);
    assert!(!active_status.can_expire);

    let summary_before_completion = client.player_summary(&player);
    assert!(summary_before_completion.exists);
    assert_eq!(summary_before_completion.active_session_id, Some(session_id));
    assert_eq!(summary_before_completion.total_started, 1);
    assert_eq!(summary_before_completion.completed_count, 0);
    assert_eq!(summary_before_completion.expired_count, 0);
    assert_eq!(summary_before_completion.total_staked, 250);

    env.ledger().set_sequence_number(5);
    client.complete_session(&player, &session_id);

    let completed_status = client.session_status(&session_id);
    assert_eq!(completed_status.state, ArenaSessionState::Completed);
    assert_eq!(completed_status.completed_at_ledger, Some(5));
    assert!(!completed_status.can_complete);

    let summary_after_completion = client.player_summary(&player);
    assert_eq!(summary_after_completion.active_session_id, None);
    assert_eq!(summary_after_completion.completed_count, 1);
}

#[test]
fn test_missing_session_returns_predictable_zero_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, player) = setup(&env);

    let status = client.session_status(&77);
    assert!(!status.exists);
    assert_eq!(status.state, ArenaSessionState::Missing);
    assert_eq!(status.player, None);

    let summary = client.player_summary(&player);
    assert!(!summary.exists);
    assert_eq!(summary.active_session_id, None);
    assert_eq!(summary.total_started, 0);
}

#[test]
fn test_pause_blocks_new_sessions() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, player) = setup(&env);

    client.set_paused(&true);
    let result = client.try_start_session(&player, &3, &100, &8);
    assert_eq!(result, Err(Ok(Error::ContractPaused)));
}

#[test]
fn test_expired_session_can_be_swept() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, player) = setup(&env);

    let session_id = client.start_session(&player, &9, &400, &2);
    env.ledger().set_sequence_number(3);

    let status_before_expire = client.session_status(&session_id);
    assert_eq!(status_before_expire.state, ArenaSessionState::Expired);
    assert!(status_before_expire.can_expire);

    client.expire_session(&session_id);

    let summary = client.player_summary(&player);
    assert_eq!(summary.active_session_id, None);
    assert_eq!(summary.expired_count, 1);
}

#[test]
fn test_active_session_summary_has_active() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player, session_id) = setup_with_session(&env);

    let summary = client.active_session_summary(&player);
    assert!(summary.has_active_session);
    assert_eq!(summary.session_id, session_id);
    assert_eq!(summary.arena_id, 1);
    assert_eq!(summary.stake_amount, 100);
    assert_eq!(summary.expires_at_ledger, 10);
    assert_eq!(summary.ledgers_remaining, 10);
}

#[test]
fn test_active_session_summary_no_session() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, player) = setup(&env);

    let summary = client.active_session_summary(&player);
    assert!(!summary.has_active_session);
    assert_eq!(summary.session_id, 0);
    assert_eq!(summary.stake_amount, 0);
    assert_eq!(summary.ledgers_remaining, 0);
}

#[test]
fn test_active_session_summary_returns_empty_after_completion() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player, session_id) = setup_with_session(&env);

    client.complete_session(&player, &session_id);

    let summary = client.active_session_summary(&player);
    assert!(!summary.has_active_session);
    assert_eq!(summary.session_id, 0);
}

#[test]
fn test_expiration_delay_active_session() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _player, session_id) = setup_with_session(&env);

    let delay = client.expiration_delay(&session_id);
    assert!(delay.exists);
    assert!(delay.is_active);
    assert!(!delay.already_expired);
    assert_eq!(delay.expires_at_ledger, 10);
    assert_eq!(delay.ledgers_remaining, 10);
}

#[test]
fn test_expiration_delay_expired_session() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _player, session_id) = setup_with_session(&env);

    env.ledger().set_sequence_number(15);
    let delay = client.expiration_delay(&session_id);
    assert!(delay.exists);
    assert!(!delay.is_active);
    assert!(delay.already_expired);
    assert_eq!(delay.ledgers_remaining, 0);
}

#[test]
fn test_expiration_delay_missing_session() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _player) = setup(&env);

    let delay = client.expiration_delay(&999);
    assert!(!delay.exists);
    assert!(!delay.is_active);
    assert!(!delay.already_expired);
    assert_eq!(delay.expires_at_ledger, 0);
}
