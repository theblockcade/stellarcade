#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    token, Address, Bytes, BytesN, Env,
};

use crate::{
    CommitSlot, Error, Move, RockPaperScissors, RockPaperScissorsClient, COMMIT_WINDOW_SECONDS,
    REVEAL_WINDOW_SECONDS,
};

const START_TS: u64 = 1_700_000_000;
const WAGER: i128 = 100;
const FEE_BPS: u32 = 500;

struct Setup {
    env: Env,
    client: RockPaperScissorsClient<'static>,
    token: token::Client<'static>,
    player1: Address,
    player2: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| li.timestamp = START_TS);

    let admin = Address::generate(&env);
    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token_admin = token::StellarAssetClient::new(&env, &sac.address());
    token_admin.mint(&player1, &1_000);
    token_admin.mint(&player2, &1_000);

    let contract_id = env.register(RockPaperScissors, ());
    let client = RockPaperScissorsClient::new(&env, &contract_id);
    client.initialize(&sac.address(), &FEE_BPS);

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
        player1,
        player2,
    }
}

fn salt(env: &Env, fill: u8) -> BytesN<32> {
    BytesN::from_array(env, &[fill; 32])
}

fn commit_hash(env: &Env, move_val: Move, salt: &BytesN<32>) -> BytesN<32> {
    let mut preimage = Bytes::new(env);
    preimage.push_back(move_val as u32 as u8);
    preimage.extend_from_array(&salt.to_array());
    env.crypto().sha256(&preimage).to_bytes()
}

// ─── Happy path ────────────────────────────────────────────────────────────

#[test]
fn happy_path_rock_beats_scissors_pays_winner_minus_fee() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let salt2 = salt(&s.env, 2);

    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));
    assert_eq!(s.token.balance(&s.player1), 900);

    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Scissors, &salt2),
    );
    assert_eq!(s.token.balance(&s.player2), 900);

    s.client
        .reveal_move(&match_id, &s.player1, &Move::Rock, &salt1);
    s.client
        .reveal_move(&match_id, &s.player2, &Move::Scissors, &salt2);

    let result = s.client.settle_match(&match_id);
    assert_eq!(result.winner, Some(s.player1.clone()));
    assert!(!result.forfeited);

    // Pot = 200, fee = 5% = 10, payout = 190.
    assert_eq!(result.fee, 10);
    assert_eq!(result.payout, 190);
    assert_eq!(s.token.balance(&s.player1), 900 + 190);
    assert_eq!(s.token.balance(&s.player2), 900);
}

#[test]
fn scissors_beats_paper() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let salt2 = salt(&s.env, 2);
    let match_id = s.client.create_match(
        &s.player1,
        &WAGER,
        &commit_hash(&s.env, Move::Scissors, &salt1),
    );
    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Paper, &salt2),
    );
    s.client
        .reveal_move(&match_id, &s.player1, &Move::Scissors, &salt1);
    s.client
        .reveal_move(&match_id, &s.player2, &Move::Paper, &salt2);

    let result = s.client.settle_match(&match_id);
    assert_eq!(result.winner, Some(s.player1.clone()));
}

#[test]
fn paper_beats_rock() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let salt2 = salt(&s.env, 2);
    let match_id = s.client.create_match(
        &s.player1,
        &WAGER,
        &commit_hash(&s.env, Move::Paper, &salt1),
    );
    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Rock, &salt2),
    );
    s.client
        .reveal_move(&match_id, &s.player1, &Move::Paper, &salt1);
    s.client
        .reveal_move(&match_id, &s.player2, &Move::Rock, &salt2);

    let result = s.client.settle_match(&match_id);
    assert_eq!(result.winner, Some(s.player1.clone()));
}

// ─── Tie ───────────────────────────────────────────────────────────────────

#[test]
fn tie_refunds_both_wagers_with_no_fee() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let salt2 = salt(&s.env, 2);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));
    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Rock, &salt2),
    );
    assert_eq!(s.token.balance(&s.player1), 900);
    assert_eq!(s.token.balance(&s.player2), 900);

    s.client
        .reveal_move(&match_id, &s.player1, &Move::Rock, &salt1);
    s.client
        .reveal_move(&match_id, &s.player2, &Move::Rock, &salt2);

    let result = s.client.settle_match(&match_id);
    assert_eq!(result.winner, None);
    assert_eq!(result.fee, 0);
    assert_eq!(result.payout, 0);
    assert_eq!(s.token.balance(&s.player1), 1_000);
    assert_eq!(s.token.balance(&s.player2), 1_000);
}

// ─── Forfeit on reveal timeout ──────────────────────────────────────────────

#[test]
fn forfeit_when_one_player_never_reveals() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let salt2 = salt(&s.env, 2);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));
    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Scissors, &salt2),
    );

    // Only player1 reveals; player2 never does.
    s.client
        .reveal_move(&match_id, &s.player1, &Move::Rock, &salt1);

    // Claiming before the reveal deadline is rejected.
    let early = s.client.try_claim_timeout(&match_id, &s.player1);
    assert_eq!(early, Err(Ok(Error::RevealWindowOpen)));

    s.env
        .ledger()
        .with_mut(|li| li.timestamp = START_TS + REVEAL_WINDOW_SECONDS + 1);

    let result = s.client.claim_timeout(&match_id, &s.player1);
    assert_eq!(result.winner, Some(s.player1.clone()));
    assert!(result.forfeited);
    // Pot = 200, fee = 5% = 10, payout = 190 — forfeit still applies the
    // normal fee, same as a proven win.
    assert_eq!(result.payout, 190);
    assert_eq!(s.token.balance(&s.player1), 900 + 190);
}

#[test]
fn mutual_refund_when_neither_player_reveals() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let salt2 = salt(&s.env, 2);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));
    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Scissors, &salt2),
    );

    s.env
        .ledger()
        .with_mut(|li| li.timestamp = START_TS + REVEAL_WINDOW_SECONDS + 1);

    let result = s.client.claim_timeout(&match_id, &s.player2);
    assert_eq!(result.winner, None);
    assert_eq!(result.fee, 0);
    assert_eq!(s.token.balance(&s.player1), 1_000);
    assert_eq!(s.token.balance(&s.player2), 1_000);
}

#[test]
fn claim_timeout_after_both_reveals_settles_normally() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let salt2 = salt(&s.env, 2);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));
    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Scissors, &salt2),
    );
    s.client
        .reveal_move(&match_id, &s.player1, &Move::Rock, &salt1);
    s.client
        .reveal_move(&match_id, &s.player2, &Move::Scissors, &salt2);

    s.env
        .ledger()
        .with_mut(|li| li.timestamp = START_TS + REVEAL_WINDOW_SECONDS + 1);

    // Both already revealed — claim_timeout still resolves the real
    // outcome rather than treating it as a forfeit.
    let result = s.client.claim_timeout(&match_id, &s.player1);
    assert_eq!(result.winner, Some(s.player1.clone()));
    assert!(!result.forfeited);
}

// ─── Invalid salt / move hash mismatch ──────────────────────────────────────

#[test]
fn reveal_with_wrong_move_is_rejected() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let salt2 = salt(&s.env, 2);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));
    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Scissors, &salt2),
    );

    // player1 committed Rock but tries to reveal Paper.
    let outcome = s
        .client
        .try_reveal_move(&match_id, &s.player1, &Move::Paper, &salt1);
    assert_eq!(outcome, Err(Ok(Error::InvalidReveal)));
}

#[test]
fn reveal_with_wrong_salt_is_rejected() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let wrong_salt = salt(&s.env, 99);
    let salt2 = salt(&s.env, 2);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));
    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Scissors, &salt2),
    );

    let outcome = s
        .client
        .try_reveal_move(&match_id, &s.player1, &Move::Rock, &wrong_salt);
    assert_eq!(outcome, Err(Ok(Error::InvalidReveal)));
}

#[test]
fn cannot_reveal_twice() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let salt2 = salt(&s.env, 2);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));
    s.client.join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Scissors, &salt2),
    );
    s.client
        .reveal_move(&match_id, &s.player1, &Move::Rock, &salt1);

    let outcome = s
        .client
        .try_reveal_move(&match_id, &s.player1, &Move::Rock, &salt1);
    assert_eq!(outcome, Err(Ok(Error::AlreadyRevealed)));
}

// ─── Match setup / join validation ──────────────────────────────────────────

#[test]
fn cannot_join_own_match() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));

    let outcome = s.client.try_join_match(
        &match_id,
        &s.player1,
        &commit_hash(&s.env, Move::Scissors, &salt(&s.env, 2)),
    );
    assert_eq!(outcome, Err(Ok(Error::CannotDuelSelf)));
}

#[test]
fn cannot_join_after_commit_window_closes() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));

    s.env
        .ledger()
        .with_mut(|li| li.timestamp = START_TS + COMMIT_WINDOW_SECONDS + 1);

    let outcome = s.client.try_join_match(
        &match_id,
        &s.player2,
        &commit_hash(&s.env, Move::Scissors, &salt(&s.env, 2)),
    );
    assert_eq!(outcome, Err(Ok(Error::JoinWindowClosed)));
}

#[test]
fn zero_wager_is_rejected() {
    let s = setup();
    let outcome = s.client.try_create_match(
        &s.player1,
        &0,
        &commit_hash(&s.env, Move::Rock, &salt(&s.env, 1)),
    );
    assert_eq!(outcome, Err(Ok(Error::InvalidWager)));
}

#[test]
fn get_match_summary_reports_commit_presence_and_reveal_state() {
    let s = setup();
    let salt1 = salt(&s.env, 1);
    let match_id =
        s.client
            .create_match(&s.player1, &WAGER, &commit_hash(&s.env, Move::Rock, &salt1));

    let summary = s.client.get_match_summary(&match_id);
    match summary.player1_commit {
        CommitSlot::Committed(c) => assert!(!c.revealed),
        CommitSlot::Empty => panic!("player1 commit missing"),
    }
    assert!(matches!(summary.player2_commit, CommitSlot::Empty));
    assert_eq!(summary.player2, None);
}
