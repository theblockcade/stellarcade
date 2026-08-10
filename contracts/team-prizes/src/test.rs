#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(env: &Env) -> (TeamPrizesClient<'_>, Address, Address) {
    let admin = Address::generate(env);
    let member = Address::generate(env);
    let contract_id = env.register(TeamPrizes, ());
    let client = TeamPrizesClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, member)
}

#[test]
fn coverage_and_delay_cover_success_path() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 1_000);

    let (client, admin, member) = setup(&env);
    client.upsert_pool(&admin, &1, &10_000u128, &300, &false);
    client.grant_eligibility(&admin, &member, &1, &2_500u128, &900);

    let coverage = client.prize_pool_coverage(&1);
    assert!(coverage.exists);
    assert_eq!(coverage.state, PoolState::Active);
    assert_eq!(coverage.total_amount, 10_000u128);
    assert_eq!(coverage.claimed_amount, 0u128);
    assert_eq!(coverage.unclaimed_amount, 10_000u128);
    assert_eq!(coverage.eligible_member_count, 1);
    assert_eq!(coverage.claimed_member_count, 0);
    assert_eq!(coverage.unclaimed_member_count, 1);
    assert_eq!(coverage.coverage_bps, 0);

    let delay = client.claim_delay_accessor(&member);
    assert!(delay.member_found && delay.pool_found);
    // eligible_at(900) + claim_delay(300) = 1_200; now=1_000 → 200s left.
    assert_eq!(delay.claim_window_opens_at, 1_200);
    assert_eq!(delay.seconds_until_claim, 200);
    assert_eq!(delay.state, ClaimDelayState::Waiting);
}

#[test]
fn claim_after_delay_updates_coverage_and_state() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 2_000);

    let (client, admin, member) = setup(&env);
    client.upsert_pool(&admin, &2, &1_000u128, &100, &false);
    client.grant_eligibility(&admin, &member, &2, &400u128, &1_800);

    // now (2_000) is past opens_at (1_800 + 100 = 1_900).
    let ready = client.claim_delay_accessor(&member);
    assert_eq!(ready.state, ClaimDelayState::Ready);
    assert_eq!(ready.seconds_until_claim, 0);

    client.claim(&member);

    let coverage = client.prize_pool_coverage(&2);
    assert_eq!(coverage.claimed_amount, 400u128);
    assert_eq!(coverage.unclaimed_amount, 600u128);
    assert_eq!(coverage.claimed_member_count, 1);
    assert_eq!(coverage.unclaimed_member_count, 0);
    // bps = 10000 * 400 / 1000 = 4000.
    assert_eq!(coverage.coverage_bps, 4_000);

    let after = client.claim_delay_accessor(&member);
    assert_eq!(after.state, ClaimDelayState::AlreadyClaimed);
    assert!(after.already_claimed);
}

#[test]
fn empty_and_missing_states_are_predictable() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 500);

    let (client, _admin, member) = setup(&env);

    let coverage = client.prize_pool_coverage(&999);
    assert!(!coverage.exists);
    assert_eq!(coverage.state, PoolState::Missing);
    assert_eq!(coverage.coverage_bps, 0);

    let delay = client.claim_delay_accessor(&member);
    assert!(!delay.member_found);
    assert_eq!(delay.state, ClaimDelayState::NoRecord);
}

#[test]
fn paused_pool_blocks_claim_delay_state() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 3_000);

    let (client, admin, member) = setup(&env);
    client.upsert_pool(&admin, &3, &500u128, &100, &false);
    client.grant_eligibility(&admin, &member, &3, &100u128, &2_500);
    // Pause after granting.
    client.upsert_pool(&admin, &3, &500u128, &100, &true);

    let coverage = client.prize_pool_coverage(&3);
    assert_eq!(coverage.state, PoolState::Paused);

    let delay = client.claim_delay_accessor(&member);
    assert_eq!(delay.state, ClaimDelayState::Blocked);
    assert!(delay.pool_paused);
}

#[test]
#[should_panic(expected = "total_amount may not decrease")]
fn upsert_cannot_shrink_total_amount() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin, _member) = setup(&env);
    client.upsert_pool(&admin, &4, &1_000u128, &50, &false);
    // Attempting to reduce the pool must revert.
    client.upsert_pool(&admin, &4, &500u128, &50, &false);
}

#[test]
fn prize_allocation_summary_success_path() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1_000);

    let (client, admin, member) = setup(&env);
    client.upsert_pool(&admin, &10, &6_000u128, &300, &false);
    client.grant_eligibility(&admin, &member, &10, &2_000u128, &900);

    let summary = client.prize_allocation_summary(&10);
    assert!(summary.configured);
    assert!(summary.pool_found);
    assert_eq!(summary.total_amount, 6_000u128);
    assert_eq!(summary.claimed_amount, 0u128);
    assert_eq!(summary.unclaimed_amount, 6_000u128);
    assert_eq!(summary.eligible_member_count, 1);
    assert_eq!(summary.claimed_member_count, 0);
    // avg = 6_000 / 1 = 6_000
    assert_eq!(summary.avg_share_per_member, 6_000u128);
    assert!(!summary.fully_distributed);
    assert!(!summary.paused);
}

#[test]
fn prize_allocation_summary_missing_pool_returns_zero_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _member) = setup(&env);

    let summary = client.prize_allocation_summary(&999);
    assert!(summary.configured);
    assert!(!summary.pool_found);
    assert_eq!(summary.total_amount, 0u128);
    assert_eq!(summary.avg_share_per_member, 0u128);
    assert!(!summary.fully_distributed);
}

#[test]
fn claim_expiry_accessor_no_expiry_and_member_found() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 500);

    let (client, admin, member) = setup(&env);
    client.upsert_pool(&admin, &11, &1_000u128, &200, &false);
    client.grant_eligibility(&admin, &member, &11, &500u128, &400);

    let info = client.claim_expiry_accessor(&member);
    assert!(info.configured);
    assert!(info.member_found);
    assert_eq!(info.pool_id, 11);
    // opens_at = eligible_at(400) + claim_delay(200) = 600
    assert_eq!(info.claim_window_opens_at, 600);
    assert!(!info.has_expiry);
    assert_eq!(info.expires_at, 0);
    assert!(!info.is_expired);
    assert!(!info.already_claimed);
}

#[test]
fn claim_expiry_accessor_member_not_found_returns_zero_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, member) = setup(&env);

    let info = client.claim_expiry_accessor(&member);
    assert!(!info.member_found);
    assert_eq!(info.pool_id, 0);
    assert!(!info.has_expiry);
    assert!(!info.is_expired);
}
