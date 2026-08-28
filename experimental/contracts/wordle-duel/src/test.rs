#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Bytes, BytesN, Env};
use types::{DuelStatus, TileResult};

fn word(env: &Env, s: &str) -> Word {
    let bytes = s.as_bytes();
    assert_eq!(bytes.len(), WORD_LENGTH, "test word must be exactly 5 letters");
    let mut arr = [0u8; WORD_LENGTH];
    arr.copy_from_slice(bytes);
    BytesN::from_array(env, &arr)
}

fn salt(env: &Env, byte: u8) -> BytesN<32> {
    BytesN::from_array(env, &[byte; 32])
}

fn hash_word(env: &Env, w: &Word, s: &BytesN<32>) -> BytesN<32> {
    let mut preimage = Bytes::new(env);
    preimage.append(&Bytes::from_array(env, &w.to_array()));
    preimage.append(&Bytes::from_array(env, &s.to_array()));
    env.crypto().sha256(&preimage).to_bytes()
}

fn setup(env: &Env) -> (WordleDuelContractClient<'static>, Address, Address) {
    let contract_id = env.register(WordleDuelContract, ());
    let client = WordleDuelContractClient::new(env, &contract_id);
    let player_a = Address::generate(env);
    let player_b = Address::generate(env);
    (client, player_a, player_b)
}

#[test]
fn test_full_match_win_in_3_attempts() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player_a, player_b) = setup(&env);

    // Player A defends "CRANE", player B defends "GRAPE".
    let a_word = word(&env, "CRANE");
    let a_salt = salt(&env, 1);
    let a_hash = hash_word(&env, &a_word, &a_salt);

    let b_word = word(&env, "GRAPE");
    let b_salt = salt(&env, 2);
    let b_hash = hash_word(&env, &b_word, &b_salt);

    let duel_id = client.create_duel(&player_a, &1_000, &a_word, &a_hash);
    client.join_duel(&duel_id, &player_b, &b_word, &b_hash);

    // Player B attacks A's word "CRANE".
    let wrong1 = client.submit_guess(&duel_id, &player_b, &word(&env, "STORM"));
    assert!(!wrong1.is_correct);

    let wrong2 = client.submit_guess(&duel_id, &player_b, &word(&env, "PLANT"));
    assert!(!wrong2.is_correct);

    let correct = client.submit_guess(&duel_id, &player_b, &word(&env, "CRANE"));
    assert!(correct.is_correct);

    let state = client.get_duel_state(&duel_id);
    assert_eq!(state.player_b_attempts, 3);

    // Both reveal — B guessed correctly, A never guessed correctly. The
    // match only settles once both have revealed.
    let first = client.reveal_and_settle(&duel_id, &player_a, &a_word, &a_salt);
    assert!(!first.is_final);
    assert_eq!(first.forfeited_by, None);

    let final_result = client.reveal_and_settle(&duel_id, &player_b, &b_word, &b_salt);
    assert!(final_result.is_final);
    assert_eq!(final_result.winner, Some(player_b.clone()));
    assert_eq!(final_result.player_b_payout, 2_000);
    assert_eq!(final_result.player_a_payout, 0);
}

#[test]
fn test_green_yellow_gray_feedback_with_duplicate_letters() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player_a, player_b) = setup(&env);

    // Secret "LEVEL" has two 'E's and two 'L's — a classic duplicate-letter
    // case that a naive single-pass scorer gets wrong.
    let a_word = word(&env, "LEVEL");
    let a_salt = salt(&env, 3);
    let a_hash = hash_word(&env, &a_word, &a_salt);

    let b_word = word(&env, "MOUNT");
    let b_salt = salt(&env, 4);
    let b_hash = hash_word(&env, &b_word, &b_salt);

    let duel_id = client.create_duel(&player_a, &500, &a_word, &a_hash);
    client.join_duel(&duel_id, &player_b, &b_word, &b_hash);

    // Guess "ELDER" against secret "LEVEL":
    // E(0) vs L -> present elsewhere (Yellow, consumes one L... wait E vs L)
    // Let's use a guess with duplicate letters instead: "LLAMA" against "LEVEL".
    let feedback = client.submit_guess(&duel_id, &player_b, &word(&env, "LLAMA"));

    // secret = L E V E L
    // guess  = L L A M A
    // i=0: L vs L -> Green
    // i=1: L vs E -> not equal; secret pool (non-green) = [E, V, E, L] after removing index0's L
    // i=2: A vs V -> not equal
    // i=3: M vs E -> not equal
    // i=4: A vs L -> not equal
    // Pass 2: i=1 guess 'L' checked against pool [E,V,E,L] (indices 1,2,3,4 of secret) -> matches pool's L at secret index 4 -> Yellow
    // i=2 guess 'A' not in remaining pool -> Gray
    // i=3 guess 'M' not in remaining pool -> Gray
    // i=4 guess 'A' not in remaining pool -> Gray
    assert_eq!(feedback.tiles.get(0).unwrap(), TileResult::Green);
    assert_eq!(feedback.tiles.get(1).unwrap(), TileResult::Yellow);
    assert_eq!(feedback.tiles.get(2).unwrap(), TileResult::Gray);
    assert_eq!(feedback.tiles.get(3).unwrap(), TileResult::Gray);
    assert_eq!(feedback.tiles.get(4).unwrap(), TileResult::Gray);
}

#[test]
fn test_yellow_does_not_overcount_beyond_actual_letter_occurrences() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player_a, player_b) = setup(&env);

    // Secret has exactly one 'S'; guessing two 'S's should yield at most
    // one Yellow/Green for that letter, not two.
    let a_word = word(&env, "STONE");
    let a_salt = salt(&env, 5);
    let a_hash = hash_word(&env, &a_word, &a_salt);

    let b_word = word(&env, "BRICK");
    let b_salt = salt(&env, 6);
    let b_hash = hash_word(&env, &b_word, &b_salt);

    let duel_id = client.create_duel(&player_a, &500, &a_word, &a_hash);
    client.join_duel(&duel_id, &player_b, &b_word, &b_hash);

    // Guess "SASSY" against secret "STONE" (one S, at position 0).
    let feedback = client.submit_guess(&duel_id, &player_b, &word(&env, "SASSY"));

    // secret = S T O N E
    // guess  = S A S S Y
    // i=0: S vs S -> Green, consumes the only S from the pool.
    // i=1: A vs T -> pool for remaining (T,O,N,E) has no A -> Gray
    // i=2: S vs O -> pool no longer has S (consumed at i=0) -> Gray
    // i=3: S vs N -> Gray
    // i=4: Y vs E -> Gray
    assert_eq!(feedback.tiles.get(0).unwrap(), TileResult::Green);
    assert_eq!(feedback.tiles.get(2).unwrap(), TileResult::Gray);
    assert_eq!(feedback.tiles.get(3).unwrap(), TileResult::Gray);
}

#[test]
#[should_panic(expected = "maximum attempts reached")]
fn test_max_6_attempts_enforced() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player_a, player_b) = setup(&env);

    let a_word = word(&env, "QUIET");
    let a_hash = hash_word(&env, &a_word, &salt(&env, 7));
    let b_word = word(&env, "BUNCH");
    let b_hash = hash_word(&env, &b_word, &salt(&env, 8));

    let duel_id = client.create_duel(&player_a, &500, &a_word, &a_hash);
    client.join_duel(&duel_id, &player_b, &b_word, &b_hash);

    for _ in 0..6 {
        client.submit_guess(&duel_id, &player_b, &word(&env, "WRONG"));
    }

    // 7th attempt must panic.
    client.submit_guess(&duel_id, &player_b, &word(&env, "WRONG"));
}

#[test]
fn test_fraudulent_reveal_forfeits_the_match() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player_a, player_b) = setup(&env);

    let a_word = word(&env, "GHOST");
    let a_salt = salt(&env, 9);
    let a_hash = hash_word(&env, &a_word, &a_salt);

    let b_word = word(&env, "TRAIN");
    let b_salt = salt(&env, 10);
    let b_hash = hash_word(&env, &b_word, &b_salt);

    let duel_id = client.create_duel(&player_a, &1_000, &a_word, &a_hash);
    client.join_duel(&duel_id, &player_b, &b_word, &b_hash);

    // Player A reveals a DIFFERENT word than what was committed to.
    let fake_word = word(&env, "FRAUD");
    let result = client.reveal_and_settle(&duel_id, &player_a, &fake_word, &a_salt);

    assert_eq!(result.forfeited_by, Some(player_a.clone()));
    assert_eq!(result.winner, Some(player_b.clone()));
    assert_eq!(result.player_b_payout, 2_000);
    assert_eq!(result.player_a_payout, 0);

    let state = client.get_duel_state(&duel_id);
    assert_eq!(state.status, DuelStatus::Forfeited);
}

#[test]
fn test_tie_when_neither_player_has_guessed_correctly_splits_the_pot() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player_a, player_b) = setup(&env);

    let a_word = word(&env, "APPLE");
    let a_salt = salt(&env, 11);
    let a_hash = hash_word(&env, &a_word, &a_salt);

    let b_word = word(&env, "MANGO");
    let b_salt = salt(&env, 12);
    let b_hash = hash_word(&env, &b_word, &b_salt);

    let duel_id = client.create_duel(&player_a, &800, &a_word, &a_hash);
    client.join_duel(&duel_id, &player_b, &b_word, &b_hash);

    client.submit_guess(&duel_id, &player_b, &word(&env, "WRONG"));
    client.submit_guess(&duel_id, &player_a, &word(&env, "WRONG"));

    client.reveal_and_settle(&duel_id, &player_a, &a_word, &a_salt);
    let result = client.reveal_and_settle(&duel_id, &player_b, &b_word, &b_salt);

    assert_eq!(result.winner, None);
    assert_eq!(result.player_a_payout, 800);
    assert_eq!(result.player_b_payout, 800);
}

#[test]
#[should_panic(expected = "already revealed")]
fn test_cannot_reveal_twice() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player_a, player_b) = setup(&env);

    let a_word = word(&env, "CHESS");
    let a_salt = salt(&env, 14);
    let a_hash = hash_word(&env, &a_word, &a_salt);
    let b_word = word(&env, "ROBIN");
    let b_hash = hash_word(&env, &b_word, &salt(&env, 15));

    let duel_id = client.create_duel(&player_a, &500, &a_word, &a_hash);
    client.join_duel(&duel_id, &player_b, &b_word, &b_hash);

    client.reveal_and_settle(&duel_id, &player_a, &a_word, &a_salt);
    // Same player reveals again before the opponent has — must be rejected.
    client.reveal_and_settle(&duel_id, &player_a, &a_word, &a_salt);
}

#[test]
#[should_panic(expected = "cannot duel yourself")]
fn test_cannot_join_own_duel() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, player_a, _player_b) = setup(&env);

    let a_word = word(&env, "SOLAR");
    let a_hash = hash_word(&env, &a_word, &salt(&env, 13));

    let duel_id = client.create_duel(&player_a, &500, &a_word, &a_hash);
    client.join_duel(&duel_id, &player_a, &a_word, &a_hash);
}
