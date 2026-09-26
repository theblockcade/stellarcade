#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token, vec, Address, Bytes, BytesN, Env,
};

use crate::{TriviaEscrow, TriviaEscrowClient};

const ENTRY_FEE: i128 = 1_000;
const DEADLINE_OFFSET: u64 = 1_000;

struct Setup {
    env: Env,
    client: TriviaEscrowClient<'static>,
    token: token::Client<'static>,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin);

    let contract_id = env.register(TriviaEscrow, ());
    let client = TriviaEscrowClient::new(&env, &contract_id);

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
    }
}

fn fund(s: &Setup, player: &Address, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.token.address).mint(player, &amount);
}

/// Canonical answer encoding mirrored from `lib.rs::encode_answers`: each
/// answer as a 4-byte big-endian u32, concatenated in order.
fn encode_answers(env: &Env, answers: &[u32]) -> Bytes {
    let mut bytes = Bytes::new(env);
    for answer in answers {
        bytes.append(&Bytes::from_array(env, &answer.to_be_bytes()));
    }
    bytes
}

fn answer_key_hash(env: &Env, answers: &[u32]) -> BytesN<32> {
    env.crypto()
        .sha256(&encode_answers(env, answers))
        .to_bytes()
}

fn commitment_hash(env: &Env, answers: &[u32], salt: &BytesN<32>) -> BytesN<32> {
    let mut bytes = encode_answers(env, answers);
    bytes.append(&Bytes::from_array(env, &salt.to_array()));
    env.crypto().sha256(&bytes).to_bytes()
}

fn salt(env: &Env, seed: u8) -> BytesN<32> {
    BytesN::from_array(env, &[seed; 32])
}

// ---------------------------------------------------------------------------
// 1. Round creation + commitment registration with token transfer
// ---------------------------------------------------------------------------

#[test]
fn test_create_round_and_submit_commitment_transfers_stake() {
    let s = setup();
    let host = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    fund(&s, &player, ENTRY_FEE);

    let key_hash = answer_key_hash(&s.env, &[1, 2, 3]);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);
    assert_eq!(round_id, 1u64);

    let commitment = commitment_hash(&s.env, &[1, 2, 3], &salt(&s.env, 7));
    s.client.submit_commitment(&player, &round_id, &commitment);

    assert_eq!(s.token.balance(&player), 0);
    assert_eq!(s.token.balance(&s.client.address), ENTRY_FEE);

    let details = s.client.get_round_details(&round_id);
    assert!(details.found);
    assert_eq!(details.total_pool, ENTRY_FEE);
    assert_eq!(details.player_count, 1);
    assert!(!details.settled);
}

// ---------------------------------------------------------------------------
// 2. Successful answer reveal + score verification
// ---------------------------------------------------------------------------

#[test]
fn test_reveal_correct_answers_scores_true() {
    let s = setup();
    let host = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    fund(&s, &player, ENTRY_FEE);

    let answers = [4u32, 5, 6];
    let key_hash = answer_key_hash(&s.env, &answers);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);

    let player_salt = salt(&s.env, 9);
    let commitment = commitment_hash(&s.env, &answers, &player_salt);
    s.client.submit_commitment(&player, &round_id, &commitment);

    // Move past the deadline before reveals are accepted.
    s.env.ledger().set_timestamp(deadline + 1);

    let answers_vec = vec![&s.env, answers[0], answers[1], answers[2]];
    let correct = s
        .client
        .reveal_answers(&player, &round_id, &answers_vec, &player_salt);
    assert!(correct);
}

#[test]
fn test_reveal_incorrect_answers_scores_false() {
    let s = setup();
    let host = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    fund(&s, &player, ENTRY_FEE);

    let key_hash = answer_key_hash(&s.env, &[1, 1, 1]);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);

    let player_salt = salt(&s.env, 3);
    let wrong_answers = [9u32, 9, 9];
    let commitment = commitment_hash(&s.env, &wrong_answers, &player_salt);
    s.client.submit_commitment(&player, &round_id, &commitment);

    s.env.ledger().set_timestamp(deadline + 1);

    let answers_vec = vec![&s.env, wrong_answers[0], wrong_answers[1], wrong_answers[2]];
    let correct = s
        .client
        .reveal_answers(&player, &round_id, &answers_vec, &player_salt);
    assert!(!correct);
}

// ---------------------------------------------------------------------------
// 3. Prize pool distribution among multiple winning players
// ---------------------------------------------------------------------------

#[test]
fn test_settle_round_splits_pot_among_winners() {
    let s = setup();
    let host = Address::generate(&s.env);
    let winner_a = Address::generate(&s.env);
    let winner_b = Address::generate(&s.env);
    let loser = Address::generate(&s.env);
    for p in [&winner_a, &winner_b, &loser] {
        fund(&s, p, ENTRY_FEE);
    }

    let correct_answers = [1u32, 2, 3];
    let key_hash = answer_key_hash(&s.env, &correct_answers);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);

    let salt_a = salt(&s.env, 1);
    let salt_b = salt(&s.env, 2);
    let salt_l = salt(&s.env, 3);
    let wrong_answers = [0u32, 0, 0];

    s.client.submit_commitment(
        &winner_a,
        &round_id,
        &commitment_hash(&s.env, &correct_answers, &salt_a),
    );
    s.client.submit_commitment(
        &winner_b,
        &round_id,
        &commitment_hash(&s.env, &correct_answers, &salt_b),
    );
    s.client.submit_commitment(
        &loser,
        &round_id,
        &commitment_hash(&s.env, &wrong_answers, &salt_l),
    );

    s.env.ledger().set_timestamp(deadline + 1);

    let ans_vec = vec![
        &s.env,
        correct_answers[0],
        correct_answers[1],
        correct_answers[2],
    ];
    let wrong_vec = vec![&s.env, wrong_answers[0], wrong_answers[1], wrong_answers[2]];
    s.client
        .reveal_answers(&winner_a, &round_id, &ans_vec, &salt_a);
    s.client
        .reveal_answers(&winner_b, &round_id, &ans_vec, &salt_b);
    s.client
        .reveal_answers(&loser, &round_id, &wrong_vec, &salt_l);

    let winners = s.client.settle_round(&round_id);
    assert_eq!(winners.len(), 2);

    let expected_payout = (ENTRY_FEE * 3) / 2;
    assert_eq!(s.token.balance(&winner_a), expected_payout);
    assert_eq!(s.token.balance(&winner_b), expected_payout);
    assert_eq!(s.token.balance(&loser), 0);

    let details = s.client.get_round_details(&round_id);
    assert!(details.settled);
}

#[test]
fn test_settle_round_rolls_over_refunds_when_nobody_qualifies() {
    let s = setup();
    let host = Address::generate(&s.env);
    let player_a = Address::generate(&s.env);
    let player_b = Address::generate(&s.env);
    fund(&s, &player_a, ENTRY_FEE);
    fund(&s, &player_b, ENTRY_FEE);

    let key_hash = answer_key_hash(&s.env, &[1, 2, 3]);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);

    let wrong_answers = [9u32, 9, 9];
    let salt_a = salt(&s.env, 1);
    let salt_b = salt(&s.env, 2);
    s.client.submit_commitment(
        &player_a,
        &round_id,
        &commitment_hash(&s.env, &wrong_answers, &salt_a),
    );
    s.client.submit_commitment(
        &player_b,
        &round_id,
        &commitment_hash(&s.env, &wrong_answers, &salt_b),
    );

    s.env.ledger().set_timestamp(deadline + 1);

    let wrong_vec = vec![&s.env, wrong_answers[0], wrong_answers[1], wrong_answers[2]];
    s.client
        .reveal_answers(&player_a, &round_id, &wrong_vec, &salt_a);
    s.client
        .reveal_answers(&player_b, &round_id, &wrong_vec, &salt_b);

    let refunded = s.client.settle_round(&round_id);
    assert_eq!(refunded.len(), 2);
    assert_eq!(s.token.balance(&player_a), ENTRY_FEE);
    assert_eq!(s.token.balance(&player_b), ENTRY_FEE);
}

// ---------------------------------------------------------------------------
// 4. Rejection of late submissions / invalid reveal proofs
// ---------------------------------------------------------------------------

#[test]
fn test_late_commitment_rejected() {
    let s = setup();
    let host = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    fund(&s, &player, ENTRY_FEE);

    let key_hash = answer_key_hash(&s.env, &[1, 2, 3]);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);

    s.env.ledger().set_timestamp(deadline + 1);

    let commitment = commitment_hash(&s.env, &[1, 2, 3], &salt(&s.env, 1));
    let result = s
        .client
        .try_submit_commitment(&player, &round_id, &commitment);
    assert!(result.is_err());
}

#[test]
fn test_reveal_with_wrong_salt_rejected() {
    let s = setup();
    let host = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    fund(&s, &player, ENTRY_FEE);

    let answers = [1u32, 2, 3];
    let key_hash = answer_key_hash(&s.env, &answers);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);

    let real_salt = salt(&s.env, 5);
    let commitment = commitment_hash(&s.env, &answers, &real_salt);
    s.client.submit_commitment(&player, &round_id, &commitment);

    s.env.ledger().set_timestamp(deadline + 1);

    let wrong_salt = salt(&s.env, 6);
    let answers_vec = vec![&s.env, answers[0], answers[1], answers[2]];
    let result = s
        .client
        .try_reveal_answers(&player, &round_id, &answers_vec, &wrong_salt);
    assert!(result.is_err());
}

#[test]
fn test_reveal_before_deadline_rejected() {
    let s = setup();
    let host = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    fund(&s, &player, ENTRY_FEE);

    let answers = [1u32, 2, 3];
    let key_hash = answer_key_hash(&s.env, &answers);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);

    let player_salt = salt(&s.env, 5);
    let commitment = commitment_hash(&s.env, &answers, &player_salt);
    s.client.submit_commitment(&player, &round_id, &commitment);

    // Deadline has not passed yet — reveal must be rejected.
    let answers_vec = vec![&s.env, answers[0], answers[1], answers[2]];
    let result = s
        .client
        .try_reveal_answers(&player, &round_id, &answers_vec, &player_salt);
    assert!(result.is_err());
}

#[test]
fn test_settle_before_deadline_rejected() {
    let s = setup();
    let host = Address::generate(&s.env);

    let key_hash = answer_key_hash(&s.env, &[1, 2, 3]);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);

    let result = s.client.try_settle_round(&round_id);
    assert!(result.is_err());
}

#[test]
fn test_double_commitment_rejected() {
    let s = setup();
    let host = Address::generate(&s.env);
    let player = Address::generate(&s.env);
    fund(&s, &player, ENTRY_FEE * 2);

    let key_hash = answer_key_hash(&s.env, &[1, 2, 3]);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;
    let round_id = s
        .client
        .create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &deadline);

    let commitment = commitment_hash(&s.env, &[1, 2, 3], &salt(&s.env, 1));
    s.client.submit_commitment(&player, &round_id, &commitment);

    let result = s
        .client
        .try_submit_commitment(&player, &round_id, &commitment);
    assert!(result.is_err());
}

#[test]
fn test_create_round_rejects_non_positive_entry_fee() {
    let s = setup();
    let host = Address::generate(&s.env);
    let key_hash = answer_key_hash(&s.env, &[1]);
    let deadline = s.env.ledger().timestamp() + DEADLINE_OFFSET;

    let result = s
        .client
        .try_create_round(&host, &s.token.address, &0i128, &key_hash, &deadline);
    assert!(result.is_err());
}

#[test]
fn test_create_round_rejects_past_deadline() {
    let s = setup();
    let host = Address::generate(&s.env);
    let key_hash = answer_key_hash(&s.env, &[1]);

    let result = s
        .client
        .try_create_round(&host, &s.token.address, &ENTRY_FEE, &key_hash, &0u64);
    assert!(result.is_err());
}
