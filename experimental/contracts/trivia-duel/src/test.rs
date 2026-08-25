#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Bytes, BytesN, Env,
};

use crate::{
    CommitSlot, DuelStatus, Error, TriviaDuel, TriviaDuelClient, BASE_POINTS, SECONDS_PER_QUESTION,
};

const START_TS: u64 = 1_700_000_000;
const WAGER: i128 = 100;
const FEE_BPS: u32 = 500;

struct Setup {
    env: Env,
    client: TriviaDuelClient<'static>,
    token: token::Client<'static>,
    admin: Address,
    host: Address,
    challenger: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = START_TS);

    let admin = Address::generate(&env);
    let host = Address::generate(&env);
    let challenger = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_admin = token::StellarAssetClient::new(&env, &sac.address());
    token_admin.mint(&host, &1_000);
    token_admin.mint(&challenger, &1_000);

    let contract_id = env.register(TriviaDuel, ());
    let client = TriviaDuelClient::new(&env, &contract_id);
    client.initialize(&admin, &sac.address(), &FEE_BPS);

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
        admin,
        host,
        challenger,
    }
}

fn salt(env: &Env, fill: u8) -> BytesN<32> {
    BytesN::from_array(env, &[fill; 32])
}

fn commit_hash(env: &Env, answer_val: u32, salt: &BytesN<32>) -> BytesN<32> {
    let mut preimage = Bytes::new(env);
    preimage.extend_from_array(&answer_val.to_be_bytes());
    preimage.extend_from_array(&salt.to_array());
    env.crypto().sha256(&preimage).to_bytes()
}

#[test]
fn full_duel_lifecycle_pays_winner_minus_fee() {
    let s = setup();
    let duel_id = s.client.create_duel(&s.host, &WAGER, &2);
    assert_eq!(s.token.balance(&s.host), 900);

    s.client.join_duel(&duel_id, &s.challenger);
    assert_eq!(s.token.balance(&s.challenger), 900);
    let deadline = START_TS + 2 * SECONDS_PER_QUESTION;
    assert_eq!(s.client.get_duel(&duel_id).commit_deadline, deadline);

    let (hs0, cs0, hs1, cs1) = (
        salt(&s.env, 1),
        salt(&s.env, 2),
        salt(&s.env, 3),
        salt(&s.env, 4),
    );

    // Round 0: both answer 2 (correct). Round 1: host 1 (wrong), challenger 3.
    s.env.ledger().with_mut(|li| li.timestamp = START_TS + 10);
    s.client
        .submit_answer_commit(&duel_id, &s.host, &0, &commit_hash(&s.env, 2, &hs0));
    s.env.ledger().with_mut(|li| li.timestamp = START_TS + 20);
    s.client
        .submit_answer_commit(&duel_id, &s.challenger, &0, &commit_hash(&s.env, 2, &cs0));
    s.env.ledger().with_mut(|li| li.timestamp = START_TS + 30);
    s.client
        .submit_answer_commit(&duel_id, &s.host, &1, &commit_hash(&s.env, 1, &hs1));
    s.env.ledger().with_mut(|li| li.timestamp = START_TS + 40);
    s.client
        .submit_answer_commit(&duel_id, &s.challenger, &1, &commit_hash(&s.env, 3, &cs1));

    s.client.reveal_answer(&duel_id, &s.host, &0, &2, &hs0);
    s.client
        .reveal_answer(&duel_id, &s.challenger, &0, &2, &cs0);
    s.client.reveal_answer(&duel_id, &s.host, &1, &1, &hs1);
    s.client
        .reveal_answer(&duel_id, &s.challenger, &1, &3, &cs1);

    s.client.record_correct_answer(&duel_id, &0, &2);
    s.client.record_correct_answer(&duel_id, &1, &3);

    // Commitment-verification accessor exposes both commits and the key.
    let round0 = s.client.get_round_state(&duel_id, &0);
    assert_eq!(round0.correct_val, Some(2));
    match round0.host_commit {
        CommitSlot::Committed(c) => {
            assert!(c.revealed);
            assert_eq!(c.answer_val, 2);
            assert_eq!(c.committed_at, START_TS + 10);
        }
        CommitSlot::Empty => panic!("host commit missing"),
    }
    match round0.challenger_commit {
        CommitSlot::Committed(c) => assert_eq!(c.committed_at, START_TS + 20),
        CommitSlot::Empty => panic!("challenger commit missing"),
    }

    let settlement = s.client.settle_duel(&duel_id);

    // Host: round 0 only = 1000 + (deadline - (start + 10)) = 1110.
    let expected_host = BASE_POINTS + (deadline - (START_TS + 10));
    // Challenger: round 0 (bonus 100) + round 1 (bonus 80) = 2180.
    let expected_challenger =
        BASE_POINTS + (deadline - (START_TS + 20)) + BASE_POINTS + (deadline - (START_TS + 40));
    assert_eq!(settlement.host_points, expected_host);
    assert_eq!(settlement.challenger_points, expected_challenger);
    assert_eq!(settlement.winner, Some(s.challenger.clone()));

    // Pot 200, 5% fee = 10, payout 190.
    assert_eq!(settlement.fee, 10);
    assert_eq!(settlement.payout, 190);
    assert_eq!(s.token.balance(&s.challenger), 1_090);
    assert_eq!(s.token.balance(&s.host), 900);
    assert_eq!(s.token.balance(&s.admin), 10);

    assert_eq!(s.client.get_duel(&duel_id).status, DuelStatus::Settled);
    assert_eq!(s.client.get_settlement(&duel_id), settlement);
}

#[test]
fn exact_tie_refunds_both_wagers_without_fee() {
    let s = setup();
    let duel_id = s.client.create_duel(&s.host, &WAGER, &1);
    s.client.join_duel(&duel_id, &s.challenger);

    let (hs, cs) = (salt(&s.env, 5), salt(&s.env, 6));
    // Both commit in the same ledger second: identical speed bonus.
    s.client
        .submit_answer_commit(&duel_id, &s.host, &0, &commit_hash(&s.env, 7, &hs));
    s.client
        .submit_answer_commit(&duel_id, &s.challenger, &0, &commit_hash(&s.env, 7, &cs));
    s.client.reveal_answer(&duel_id, &s.host, &0, &7, &hs);
    s.client.reveal_answer(&duel_id, &s.challenger, &0, &7, &cs);
    s.client.record_correct_answer(&duel_id, &0, &7);

    let settlement = s.client.settle_duel(&duel_id);
    assert_eq!(settlement.winner, None);
    assert_eq!(settlement.payout, 0);
    assert_eq!(settlement.fee, 0);
    assert_eq!(settlement.host_points, settlement.challenger_points);
    assert_eq!(s.token.balance(&s.host), 1_000);
    assert_eq!(s.token.balance(&s.challenger), 1_000);
    assert_eq!(s.token.balance(&s.admin), 0);
}

#[test]
fn invalid_reveal_is_rejected() {
    let s = setup();
    let duel_id = s.client.create_duel(&s.host, &WAGER, &1);
    s.client.join_duel(&duel_id, &s.challenger);

    let good_salt = salt(&s.env, 9);
    s.client
        .submit_answer_commit(&duel_id, &s.host, &0, &commit_hash(&s.env, 4, &good_salt));
    s.client.submit_answer_commit(
        &duel_id,
        &s.challenger,
        &0,
        &commit_hash(&s.env, 4, &good_salt),
    );

    // Wrong salt.
    assert_eq!(
        s.client
            .try_reveal_answer(&duel_id, &s.host, &0, &4, &salt(&s.env, 10)),
        Err(Ok(Error::InvalidReveal))
    );
    // Wrong value.
    assert_eq!(
        s.client
            .try_reveal_answer(&duel_id, &s.host, &0, &5, &good_salt),
        Err(Ok(Error::InvalidReveal))
    );
    // Correct value + salt still works afterwards.
    s.client
        .reveal_answer(&duel_id, &s.host, &0, &4, &good_salt);
    assert_eq!(
        s.client
            .try_reveal_answer(&duel_id, &s.host, &0, &4, &good_salt),
        Err(Ok(Error::AlreadyRevealed))
    );
}

#[test]
fn reveal_is_blocked_until_opponent_commits_or_deadline() {
    let s = setup();
    let duel_id = s.client.create_duel(&s.host, &WAGER, &1);
    s.client.join_duel(&duel_id, &s.challenger);

    let hs = salt(&s.env, 11);
    s.client
        .submit_answer_commit(&duel_id, &s.host, &0, &commit_hash(&s.env, 1, &hs));

    // Challenger has not committed and the window is still open.
    assert_eq!(
        s.client.try_reveal_answer(&duel_id, &s.host, &0, &1, &hs),
        Err(Ok(Error::RevealTooEarly))
    );

    // After the commit deadline the reveal goes through.
    s.env
        .ledger()
        .with_mut(|li| li.timestamp = START_TS + SECONDS_PER_QUESTION + 1);
    s.client.reveal_answer(&duel_id, &s.host, &0, &1, &hs);
}

#[test]
fn commit_guards_hold() {
    let s = setup();
    let duel_id = s.client.create_duel(&s.host, &WAGER, &1);
    s.client.join_duel(&duel_id, &s.challenger);

    let hash = commit_hash(&s.env, 1, &salt(&s.env, 12));
    let outsider = Address::generate(&s.env);
    assert_eq!(
        s.client
            .try_submit_answer_commit(&duel_id, &outsider, &0, &hash),
        Err(Ok(Error::NotDuelPlayer))
    );
    assert_eq!(
        s.client
            .try_submit_answer_commit(&duel_id, &s.host, &5, &hash),
        Err(Ok(Error::InvalidRound))
    );

    s.client.submit_answer_commit(&duel_id, &s.host, &0, &hash);
    assert_eq!(
        s.client
            .try_submit_answer_commit(&duel_id, &s.host, &0, &hash),
        Err(Ok(Error::AlreadyCommitted))
    );

    s.env
        .ledger()
        .with_mut(|li| li.timestamp = START_TS + SECONDS_PER_QUESTION + 1);
    assert_eq!(
        s.client
            .try_submit_answer_commit(&duel_id, &s.challenger, &0, &hash),
        Err(Ok(Error::CommitPhaseClosed))
    );
}

#[test]
fn settle_guards_hold() {
    let s = setup();
    let duel_id = s.client.create_duel(&s.host, &WAGER, &1);

    // Not joined yet.
    assert_eq!(
        s.client.try_settle_duel(&duel_id),
        Err(Ok(Error::DuelNotInProgress))
    );

    s.client.join_duel(&duel_id, &s.challenger);

    // Window still open and rounds not fully revealed.
    assert_eq!(
        s.client.try_settle_duel(&duel_id),
        Err(Ok(Error::SettleTooEarly))
    );

    // Past the deadline but the admin never recorded the answer key.
    s.env
        .ledger()
        .with_mut(|li| li.timestamp = START_TS + SECONDS_PER_QUESTION + 1);
    assert_eq!(
        s.client.try_settle_duel(&duel_id),
        Err(Ok(Error::AnswerKeyIncomplete))
    );

    // With the key recorded, an uncontested duel settles as a 0-0 tie.
    s.client.record_correct_answer(&duel_id, &0, &1);
    let settlement = s.client.settle_duel(&duel_id);
    assert_eq!(settlement.winner, None);
    assert_eq!(s.token.balance(&s.host), 1_000);
    assert_eq!(s.token.balance(&s.challenger), 1_000);

    assert_eq!(
        s.client.try_settle_duel(&duel_id),
        Err(Ok(Error::DuelNotInProgress))
    );
}

#[test]
fn create_and_join_validation() {
    let s = setup();

    assert_eq!(
        s.client.try_create_duel(&s.host, &0, &1),
        Err(Ok(Error::InvalidWager))
    );
    assert_eq!(
        s.client.try_create_duel(&s.host, &WAGER, &0),
        Err(Ok(Error::InvalidQuestionCount))
    );
    assert_eq!(
        s.client.try_create_duel(&s.host, &WAGER, &26),
        Err(Ok(Error::InvalidQuestionCount))
    );

    let duel_id = s.client.create_duel(&s.host, &WAGER, &1);
    assert_eq!(
        s.client.try_join_duel(&duel_id, &s.host),
        Err(Ok(Error::CannotDuelSelf))
    );
    assert_eq!(
        s.client.try_join_duel(&99, &s.challenger),
        Err(Ok(Error::DuelNotFound))
    );

    s.client.join_duel(&duel_id, &s.challenger);
    let third = Address::generate(&s.env);
    assert_eq!(
        s.client.try_join_duel(&duel_id, &third),
        Err(Ok(Error::NotJoinable))
    );
}

#[test]
fn initialize_guards() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let contract_id = env.register(TriviaDuel, ());
    let client = TriviaDuelClient::new(&env, &contract_id);

    // Not initialized yet: duels cannot be created.
    let host = Address::generate(&env);
    assert_eq!(
        client.try_create_duel(&host, &WAGER, &1),
        Err(Ok(Error::NotInitialized))
    );

    assert_eq!(
        client.try_initialize(&admin, &sac.address(), &1_001),
        Err(Ok(Error::FeeTooHigh))
    );
    client.initialize(&admin, &sac.address(), &FEE_BPS);
    assert_eq!(
        client.try_initialize(&admin, &sac.address(), &FEE_BPS),
        Err(Ok(Error::AlreadyInitialized))
    );
}
