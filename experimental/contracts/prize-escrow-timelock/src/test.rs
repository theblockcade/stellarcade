#![cfg(test)]

use soroban_sdk::{symbol_short, testutils::Address as _, testutils::Ledger, Address, Env};

use crate::{Error, PayoutStatus, PrizeEscrowTimelock, PrizeEscrowTimelockClient};

const ONE_HOUR: u64 = 3600;

fn setup() -> (
    Env,
    PrizeEscrowTimelockClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.mock_all_auths();
    let tournament = Address::generate(&env);
    let arbiter = Address::generate(&env);
    let winner = Address::generate(&env);
    let contract_id = env.register(PrizeEscrowTimelock, ());
    let client = PrizeEscrowTimelockClient::new(&env, &contract_id);
    (env, client, tournament, arbiter, winner)
}

#[test]
fn queueing_payout_and_successful_claim_after_timelock_passage() {
    let (env, client, tournament, arbiter, winner) = setup();
    let amount: u128 = 5_000;

    let payout_id = client.queue_payout(&tournament, &arbiter, &winner, &amount, &ONE_HOUR);

    let summary = client.get_payout_status(&payout_id);
    assert_eq!(summary.status, PayoutStatus::Pending);
    assert_eq!(summary.amount, amount);
    assert_eq!(summary.unlock_at, summary.queued_at + ONE_HOUR);

    env.ledger().with_mut(|l| {
        l.timestamp += ONE_HOUR + 1;
    });

    let claimed = client.claim_payout(&payout_id, &winner);
    assert_eq!(claimed, amount);

    let summary = client.get_payout_status(&payout_id);
    assert_eq!(summary.status, PayoutStatus::Claimed);
}

#[test]
fn premature_claim_is_rejected() {
    let (env, client, tournament, arbiter, winner) = setup();
    let payout_id = client.queue_payout(&tournament, &arbiter, &winner, &1_000u128, &ONE_HOUR);

    let result = client.try_claim_payout(&payout_id, &winner);
    assert_eq!(result, Err(Ok(Error::TimelockNotExpired)));

    // Still rejected just 1 second before expiry.
    env.ledger().with_mut(|l| {
        l.timestamp += ONE_HOUR - 1;
    });
    let result = client.try_claim_payout(&payout_id, &winner);
    assert_eq!(result, Err(Ok(Error::TimelockNotExpired)));
}

#[test]
fn arbiter_freeze_and_refund_workflow() {
    let (env, client, tournament, arbiter, winner) = setup();
    let amount: u128 = 2_500;
    let payout_id = client.queue_payout(&tournament, &arbiter, &winner, &amount, &ONE_HOUR);

    let reason = symbol_short!("cheating");
    client.freeze_payout(&arbiter, &payout_id, &reason);

    let summary = client.get_payout_status(&payout_id);
    assert_eq!(summary.status, PayoutStatus::Frozen);
    assert_eq!(summary.freeze_reason, Some(reason));

    // Claim is blocked while frozen, even after the timelock would have
    // expired.
    env.ledger().with_mut(|l| {
        l.timestamp += ONE_HOUR + 1;
    });
    let result = client.try_claim_payout(&payout_id, &winner);
    assert_eq!(result, Err(Ok(Error::PayoutFrozen)));

    // Arbiter confirms fraud: funds redirected back to the pool.
    let redirected_amount = client.resolve_payout(&arbiter, &payout_id, &false);
    assert_eq!(redirected_amount, amount);

    let summary = client.get_payout_status(&payout_id);
    assert_eq!(summary.status, PayoutStatus::Redirected);

    let result = client.try_claim_payout(&payout_id, &winner);
    assert_eq!(result, Err(Ok(Error::PayoutAlreadySettled)));
}

#[test]
fn arbiter_can_release_a_frozen_payout_back_to_pending() {
    let (env, client, tournament, arbiter, winner) = setup();
    let payout_id = client.queue_payout(&tournament, &arbiter, &winner, &1_000u128, &ONE_HOUR);

    let reason = symbol_short!("review");
    client.freeze_payout(&arbiter, &payout_id, &reason);

    let release = client.resolve_payout(&arbiter, &payout_id, &true);
    assert_eq!(release, 0);

    let summary = client.get_payout_status(&payout_id);
    assert_eq!(summary.status, PayoutStatus::Pending);
    assert_eq!(summary.freeze_reason, None);

    env.ledger().with_mut(|l| {
        l.timestamp += ONE_HOUR + 1;
    });
    let claimed = client.claim_payout(&payout_id, &winner);
    assert_eq!(claimed, 1_000);
}

#[test]
fn non_arbiter_cannot_freeze_a_payout() {
    let (env, client, tournament, arbiter, winner) = setup();
    let payout_id = client.queue_payout(&tournament, &arbiter, &winner, &1_000u128, &ONE_HOUR);

    let outsider = Address::generate(&env);
    let reason = symbol_short!("bogus");
    let result = client.try_freeze_payout(&outsider, &payout_id, &reason);
    assert_eq!(result, Err(Ok(Error::UnauthorizedArbiter)));
}

#[test]
fn cannot_freeze_after_timelock_expires() {
    let (env, client, tournament, arbiter, winner) = setup();
    let payout_id = client.queue_payout(&tournament, &arbiter, &winner, &1_000u128, &ONE_HOUR);

    env.ledger().with_mut(|l| {
        l.timestamp += ONE_HOUR + 1;
    });

    let reason = symbol_short!("late");
    let result = client.try_freeze_payout(&arbiter, &payout_id, &reason);
    assert_eq!(result, Err(Ok(Error::TimelockNotExpired)));
}

#[test]
fn only_the_designated_winner_can_claim() {
    let (env, client, tournament, arbiter, winner) = setup();
    let payout_id = client.queue_payout(&tournament, &arbiter, &winner, &1_000u128, &ONE_HOUR);

    env.ledger().with_mut(|l| {
        l.timestamp += ONE_HOUR + 1;
    });

    let outsider = Address::generate(&env);
    let result = client.try_claim_payout(&payout_id, &outsider);
    assert_eq!(result, Err(Ok(Error::UnauthorizedWinner)));
}

#[test]
#[should_panic]
fn queue_payout_panics_without_tournament_contract_auth() {
    let (env, client, tournament, arbiter, winner) = setup();
    env.set_auths(&[]);
    client.queue_payout(&tournament, &arbiter, &winner, &1_000u128, &ONE_HOUR);
}
