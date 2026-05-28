#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(env: &Env) -> (LobbyEscrowClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let participant = Address::generate(env);
    let contract_id = env.register(LobbyEscrow, ());
    let client = LobbyEscrowClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, participant)
}

#[test]
fn coverage_and_delay_cover_funding_to_release() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_000);

    let (client, admin, p1) = setup(&env);
    client.upsert_escrow(&admin, &1, &1_000u128, &300, &false);

    // Pre-funding: state = Funding, coverage 0bps, underfunded.
    let s0 = client.escrow_coverage_summary(&1);
    assert!(s0.exists);
    assert_eq!(s0.state, EscrowState::Funding);
    assert_eq!(s0.coverage_bps, 0);
    assert!(!s0.fully_funded);

    let d0 = client.release_delay_accessor(&1);
    assert_eq!(d0.state, ReleaseDelayState::Underfunded);
    assert_eq!(d0.release_window_opens_at, 1_300);
    assert_eq!(d0.seconds_until_release, 300);

    // Fund halfway.
    client.fund(&p1, &1, &600u128);
    let s1 = client.escrow_coverage_summary(&1);
    assert_eq!(s1.total_funded, 600);
    assert_eq!(s1.remaining_amount, 400);
    assert_eq!(s1.coverage_bps, 6_000);
    assert!(!s1.fully_funded);

    // Fund the rest with a different participant.
    let p2 = Address::generate(&env);
    client.fund(&p2, &1, &400u128);
    let s2 = client.escrow_coverage_summary(&1);
    assert_eq!(s2.total_funded, 1_000);
    assert_eq!(s2.coverage_bps, 10_000);
    assert!(s2.fully_funded);
    assert_eq!(s2.state, EscrowState::Active);
    assert_eq!(s2.participant_count, 2);

    // Fully funded but window hasn't opened — Waiting.
    let d_wait = client.release_delay_accessor(&1);
    assert_eq!(d_wait.state, ReleaseDelayState::Waiting);

    // Advance past the release window.
    env.ledger().with_mut(|l| l.timestamp = 1_500);
    let d_ready = client.release_delay_accessor(&1);
    assert_eq!(d_ready.state, ReleaseDelayState::Releasable);
    assert_eq!(d_ready.seconds_until_release, 0);

    // Release.
    client.release_funds(&admin, &1);
    let s_done = client.escrow_coverage_summary(&1);
    assert_eq!(s_done.state, EscrowState::Released);
    let d_done = client.release_delay_accessor(&1);
    assert_eq!(d_done.state, ReleaseDelayState::Released);
    assert!(d_done.already_released);
}

#[test]
fn coverage_bps_clamped_at_10_000_when_overfunded() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, p1) = setup(&env);
    client.upsert_escrow(&admin, &2, &100u128, &10, &false);
    client.fund(&p1, &2, &500u128);
    let s = client.escrow_coverage_summary(&2);
    assert_eq!(s.coverage_bps, 10_000);
    assert!(s.fully_funded);
}

#[test]
fn empty_and_missing_states_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _p) = setup(&env);

    let s = client.escrow_coverage_summary(&999);
    assert!(!s.exists);
    assert_eq!(s.state, EscrowState::Missing);
    assert_eq!(s.coverage_bps, 0);

    let d = client.release_delay_accessor(&999);
    assert!(!d.exists);
    assert_eq!(d.state, ReleaseDelayState::Missing);
    assert_eq!(d.seconds_until_release, 0);
}

#[test]
fn paused_escrow_blocks_release_delay_state() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 2_000);
    let (client, admin, p) = setup(&env);

    client.upsert_escrow(&admin, &3, &200u128, &50, &false);
    client.fund(&p, &3, &200u128);
    // Pause after funding.
    client.upsert_escrow(&admin, &3, &200u128, &50, &true);

    let s = client.escrow_coverage_summary(&3);
    assert_eq!(s.state, EscrowState::Paused);

    let d = client.release_delay_accessor(&3);
    assert_eq!(d.state, ReleaseDelayState::Blocked);
    assert!(d.paused);
}

#[test]
#[should_panic(expected = "Participant already funded")]
fn duplicate_fund_panics() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, p) = setup(&env);
    client.upsert_escrow(&admin, &4, &500u128, &30, &false);
    client.fund(&p, &4, &100u128);
    client.fund(&p, &4, &100u128);
}

#[test]
#[should_panic(expected = "required_amount may not decrease")]
fn upsert_cannot_shrink_required_amount() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, _) = setup(&env);
    client.upsert_escrow(&admin, &5, &1_000u128, &30, &false);
    client.upsert_escrow(&admin, &5, &500u128, &30, &false);
}

#[test]
#[should_panic(expected = "Escrow underfunded")]
fn cannot_release_when_underfunded() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 5_000);
    let (client, admin, p) = setup(&env);
    client.upsert_escrow(&admin, &6, &1_000u128, &10, &false);
    client.fund(&p, &6, &500u128); // only half
    env.ledger().with_mut(|l| l.timestamp = 5_100); // past window
    client.release_funds(&admin, &6);
}
