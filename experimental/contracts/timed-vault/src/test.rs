#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env};
use types::{PositionStatus, LOCK_30_DAYS_SEC, LOCK_7_DAYS_SEC, LOCK_90_DAYS_SEC};

fn setup() -> (Env, TimedVaultContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(TimedVaultContract, ());
    let client = TimedVaultContractClient::new(&env, &contract_id);
    (env, client)
}

#[test]
fn test_deposit_7_day_tier_multiplier() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    let position_id = client.deposit(&user, &1_000u128, &LOCK_7_DAYS_SEC);
    let summary = client.get_position(&position_id);

    assert_eq!(summary.multiplier_bps, 10_000); // 1.0x
    assert_eq!(summary.principal, 1_000);
    assert_eq!(summary.projected_payout, 1_000);
}

#[test]
fn test_deposit_30_day_tier_multiplier() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    let position_id = client.deposit(&user, &1_000u128, &LOCK_30_DAYS_SEC);
    let summary = client.get_position(&position_id);

    assert_eq!(summary.multiplier_bps, 15_000); // 1.5x
    assert_eq!(summary.projected_payout, 1_500);
}

#[test]
fn test_deposit_90_day_tier_multiplier() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    let position_id = client.deposit(&user, &1_000u128, &LOCK_90_DAYS_SEC);
    let summary = client.get_position(&position_id);

    assert_eq!(summary.multiplier_bps, 25_000); // 2.5x
    assert_eq!(summary.projected_payout, 2_500);
}

#[test]
#[should_panic(expected = "lock_duration_sec must be one of")]
fn test_deposit_rejects_unsupported_lock_duration() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    // 14 days is not one of the supported tiers.
    client.deposit(&user, &1_000u128, &(14 * 24 * 60 * 60u64));
}

#[test]
#[should_panic(expected = "deposit amount must be greater than 0")]
fn test_deposit_rejects_zero_amount() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    client.deposit(&user, &0u128, &LOCK_7_DAYS_SEC);
}

#[test]
fn test_mature_withdrawal_pays_multiplier_adjusted_amount() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let position_id = client.deposit(&user, &2_000u128, &LOCK_30_DAYS_SEC);

    // Advance past maturity (30 days).
    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + LOCK_30_DAYS_SEC + 1);

    let payout = client.withdraw(&position_id, &user);

    assert_eq!(payout.principal, 2_000);
    assert_eq!(payout.amount_paid, 3_000); // 2000 * 1.5x
    assert_eq!(payout.penalty_paid, 0);
    assert!(!payout.was_emergency);

    let summary = client.get_position(&position_id);
    assert_eq!(summary.status, PositionStatus::Withdrawn);
}

#[test]
#[should_panic(expected = "has not reached maturity")]
fn test_premature_withdrawal_rejected() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let position_id = client.deposit(&user, &1_000u128, &LOCK_30_DAYS_SEC);

    // Only 1 day elapsed, far short of the 30-day lock.
    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + 24 * 60 * 60);

    client.withdraw(&position_id, &user);
}

#[test]
#[should_panic(expected = "position is not active")]
fn test_double_withdrawal_rejected() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let position_id = client.deposit(&user, &1_000u128, &LOCK_7_DAYS_SEC);
    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + LOCK_7_DAYS_SEC + 1);

    client.withdraw(&position_id, &user);
    // Second withdrawal on an already-withdrawn position must fail.
    client.withdraw(&position_id, &user);
}

#[test]
fn test_emergency_withdrawal_applies_penalty_accurately() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let position_id = client.deposit(&user, &10_000u128, &LOCK_90_DAYS_SEC);

    // Still well before maturity.
    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + 24 * 60 * 60);

    let payout = client.emergency_withdraw(&position_id, &user);

    // 10% of 10,000 principal = 1,000 penalty; payout = 9,000.
    // Note: the multiplier is forfeited entirely on early exit.
    assert_eq!(payout.principal, 10_000);
    assert_eq!(payout.penalty_paid, 1_000);
    assert_eq!(payout.amount_paid, 9_000);
    assert!(payout.was_emergency);

    let summary = client.get_position(&position_id);
    assert_eq!(summary.status, PositionStatus::EmergencyWithdrawn);
}

#[test]
#[should_panic(expected = "already matured")]
fn test_emergency_withdrawal_rejected_after_maturity() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let position_id = client.deposit(&user, &1_000u128, &LOCK_7_DAYS_SEC);
    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + LOCK_7_DAYS_SEC + 1);

    // Should have used withdraw() instead once matured.
    client.emergency_withdraw(&position_id, &user);
}

#[test]
#[should_panic(expected = "does not belong to caller")]
fn test_withdrawal_rejected_for_non_owner() {
    let (env, client) = setup();
    let owner = Address::generate(&env);
    let attacker = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let position_id = client.deposit(&owner, &1_000u128, &LOCK_7_DAYS_SEC);
    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + LOCK_7_DAYS_SEC + 1);

    client.withdraw(&position_id, &attacker);
}

#[test]
fn test_get_position_reports_maturity_flag_correctly() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);
    let position_id = client.deposit(&user, &1_000u128, &LOCK_7_DAYS_SEC);

    let before = client.get_position(&position_id);
    assert!(!before.is_mature);

    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + LOCK_7_DAYS_SEC);
    let at_maturity = client.get_position(&position_id);
    assert!(at_maturity.is_mature);
}

#[test]
fn test_multi_user_concurrent_accounting() {
    let (env, client) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let carol = Address::generate(&env);

    env.ledger().with_mut(|l| l.timestamp = 1_000);

    let alice_pos = client.deposit(&alice, &1_000u128, &LOCK_7_DAYS_SEC);
    let bob_pos = client.deposit(&bob, &5_000u128, &LOCK_30_DAYS_SEC);
    let carol_pos = client.deposit(&carol, &2_000u128, &LOCK_90_DAYS_SEC);

    let stats_after_deposits = client.get_vault_stats();
    assert_eq!(stats_after_deposits.total_positions, 3);
    assert_eq!(stats_after_deposits.active_positions, 3);
    assert_eq!(stats_after_deposits.total_deposited, 8_000);
    assert_eq!(stats_after_deposits.total_withdrawn, 0);

    // Alice withdraws early (emergency), Bob and Carol wait for maturity.
    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + 24 * 60 * 60);
    let alice_payout = client.emergency_withdraw(&alice_pos, &alice);
    assert_eq!(alice_payout.amount_paid, 900); // 1000 - 10%
    assert_eq!(alice_payout.penalty_paid, 100);

    let stats_after_alice = client.get_vault_stats();
    assert_eq!(stats_after_alice.active_positions, 2);
    assert_eq!(stats_after_alice.total_withdrawn, 900);
    assert_eq!(stats_after_alice.total_penalties_collected, 100);
    // Deposits ledger is untouched by withdrawals.
    assert_eq!(stats_after_alice.total_deposited, 8_000);

    // Advance to Bob's maturity (30 days) but before Carol's (90 days).
    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + LOCK_30_DAYS_SEC + 1);
    let bob_payout = client.withdraw(&bob_pos, &bob);
    assert_eq!(bob_payout.amount_paid, 7_500); // 5000 * 1.5x

    let stats_after_bob = client.get_vault_stats();
    assert_eq!(stats_after_bob.active_positions, 1);
    assert_eq!(stats_after_bob.total_withdrawn, 900 + 7_500);

    // Carol's position is still active and not yet mature.
    let carol_summary = client.get_position(&carol_pos);
    assert_eq!(carol_summary.status, PositionStatus::Active);
    assert!(!carol_summary.is_mature);

    // Advance to Carol's maturity (90 days).
    env.ledger()
        .with_mut(|l| l.timestamp = 1_000 + LOCK_90_DAYS_SEC + 1);
    let carol_payout = client.withdraw(&carol_pos, &carol);
    assert_eq!(carol_payout.amount_paid, 5_000); // 2000 * 2.5x

    let final_stats = client.get_vault_stats();
    assert_eq!(final_stats.total_positions, 3);
    assert_eq!(final_stats.active_positions, 0);
    assert_eq!(final_stats.total_deposited, 8_000);
    assert_eq!(final_stats.total_withdrawn, 900 + 7_500 + 5_000);
    assert_eq!(final_stats.total_penalties_collected, 100);

    // Each user's position is independently addressable and unaffected by
    // the others' concurrent activity.
    assert_eq!(
        client.get_position(&alice_pos).status,
        PositionStatus::EmergencyWithdrawn
    );
    assert_eq!(
        client.get_position(&bob_pos).status,
        PositionStatus::Withdrawn
    );
    assert_eq!(
        client.get_position(&carol_pos).status,
        PositionStatus::Withdrawn
    );
}

#[test]
fn test_position_ids_increment_across_multiple_deposits_from_same_user() {
    let (env, client) = setup();
    let user = Address::generate(&env);

    let first = client.deposit(&user, &100u128, &LOCK_7_DAYS_SEC);
    let second = client.deposit(&user, &200u128, &LOCK_7_DAYS_SEC);
    let third = client.deposit(&user, &300u128, &LOCK_7_DAYS_SEC);

    assert_eq!(first, 1);
    assert_eq!(second, 2);
    assert_eq!(third, 3);

    // Each position tracks its own principal independently.
    assert_eq!(client.get_position(&first).principal, 100);
    assert_eq!(client.get_position(&second).principal, 200);
    assert_eq!(client.get_position(&third).principal, 300);
}
