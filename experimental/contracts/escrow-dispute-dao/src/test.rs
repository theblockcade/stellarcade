use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

use crate::{Error, EscrowDisputeDao, EscrowDisputeDaoClient, JurorVote};

fn setup() -> (Env, EscrowDisputeDaoClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(EscrowDisputeDao, ());
    let client = EscrowDisputeDaoClient::new(&env, &contract_id);
    (env, client)
}

fn evidence(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &[1u8; 32])
}

#[test]
fn stake_juror_and_open_dispute() {
    let (env, client) = setup();
    let juror = Address::generate(&env);
    let reporter = Address::generate(&env);

    client.stake_juror(&juror, &100i128);
    let id = client.open_dispute(&reporter, &1, &500i128, &evidence(&env));
    assert_eq!(id, 0);

    let summary = client.get_dispute(&id);
    assert_eq!(summary.match_id, 1);
    assert_eq!(summary.escrow_amount, 500i128);
}

#[test]
fn three_juror_dispute_with_majority() {
    let (env, client) = setup();
    let j1 = Address::generate(&env);
    let j2 = Address::generate(&env);
    let j3 = Address::generate(&env);
    let reporter = Address::generate(&env);

    client.stake_juror(&j1, &100i128);
    client.stake_juror(&j2, &100i128);
    client.stake_juror(&j3, &100i128);

    let id = client.open_dispute(&reporter, &1, &500i128, &evidence(&env));

    client.cast_juror_vote(&id, &j1, &JurorVote::Player1Wins);
    client.cast_juror_vote(&id, &j2, &JurorVote::Player1Wins);
    client.cast_juror_vote(&id, &j3, &JurorVote::Player2Wins);

    let verdict = client.resolve_dispute(&id);
    assert_eq!(verdict.winner, JurorVote::Player1Wins);
    assert!(verdict.resolved);
}

#[test]
fn refund_verdict_on_majority_invalidate() {
    let (env, client) = setup();
    let j1 = Address::generate(&env);
    let j2 = Address::generate(&env);
    let j3 = Address::generate(&env);
    let reporter = Address::generate(&env);

    client.stake_juror(&j1, &100i128);
    client.stake_juror(&j2, &100i128);
    client.stake_juror(&j3, &100i128);

    let id = client.open_dispute(&reporter, &2, &300i128, &evidence(&env));

    client.cast_juror_vote(&id, &j1, &JurorVote::InvalidateRefund);
    client.cast_juror_vote(&id, &j2, &JurorVote::InvalidateRefund);
    client.cast_juror_vote(&id, &j3, &JurorVote::Player1Wins);

    let verdict = client.resolve_dispute(&id);
    assert_eq!(verdict.winner, JurorVote::InvalidateRefund);
}

#[test]
fn non_tribunal_juror_rejected() {
    let (env, client) = setup();
    let j1 = Address::generate(&env);
    let stranger = Address::generate(&env);
    let reporter = Address::generate(&env);

    client.stake_juror(&j1, &100i128);
    let id = client.open_dispute(&reporter, &1, &500i128, &evidence(&env));

    let result = client.try_cast_juror_vote(&id, &stranger, &JurorVote::Player1Wins);
    assert_eq!(result, Err(Ok(Error::NotAssignedToTribunal)));
}

#[test]
fn duplicate_vote_rejected() {
    let (env, client) = setup();
    let j1 = Address::generate(&env);
    let reporter = Address::generate(&env);

    client.stake_juror(&j1, &100i128);
    let id = client.open_dispute(&reporter, &1, &500i128, &evidence(&env));

    client.cast_juror_vote(&id, &j1, &JurorVote::Player1Wins);
    let result = client.try_cast_juror_vote(&id, &j1, &JurorVote::Player2Wins);
    assert_eq!(result, Err(Ok(Error::AlreadyVoted)));
}

#[test]
fn reporter_cannot_vote_on_own_dispute() {
    let (env, client) = setup();
    let reporter = Address::generate(&env);

    client.stake_juror(&reporter, &100i128);
    let id = client.open_dispute(&reporter, &1, &500i128, &evidence(&env));

    let result = client.try_cast_juror_vote(&id, &reporter, &JurorVote::Player1Wins);
    assert_eq!(result, Err(Ok(Error::CannotVoteOnOwnDispute)));
}
