#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, Vec,
};

use crate::{
    Error, GameStatus, MemoryMatrix, MemoryMatrixClient, COMPLETION_BONUS, POINTS_PER_STEP,
    ROUND_TIME_LIMIT_SECS,
};

fn setup() -> (Env, MemoryMatrixClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|li| {
        li.timestamp = 1_700_000_000;
        li.sequence_number = 100;
    });
    let contract_id = env.register(MemoryMatrix, ());
    let client = MemoryMatrixClient::new(&env, &contract_id);
    let player = Address::generate(&env);
    (env, client, player)
}

#[test]
fn start_game_generates_bounded_pattern() {
    let (_env, client, player) = setup();

    let game_id = client.start_game(&player, &4, &2);
    let pattern = client.get_round_pattern(&game_id);

    // difficulty 2 => 3 + 2 * 2 = 7 steps, all within the 4x4 grid.
    assert_eq!(pattern.len(), 7);
    for cell in pattern.iter() {
        assert!(cell < 16);
    }

    let summary = client.get_game_state(&game_id);
    assert_eq!(summary.status, GameStatus::Active);
    assert_eq!(summary.pattern_len, 7);
    assert_eq!(summary.deadline, summary.started_at + ROUND_TIME_LIMIT_SECS);
}

#[test]
fn distinct_rounds_get_distinct_patterns() {
    let (_env, client, player) = setup();

    let a = client.start_game(&player, &4, &3);
    let b = client.start_game(&player, &4, &3);
    // Same ledger state, but the per-player nonce and game id differ.
    assert_ne!(client.get_round_pattern(&a), client.get_round_pattern(&b));
}

#[test]
fn perfect_submission_scores_full_formula() {
    let (env, client, player) = setup();

    let game_id = client.start_game(&player, &4, &1);
    let pattern = client.get_round_pattern(&game_id);
    let pattern_len = pattern.len();

    // Submit 100 seconds into the 300 second round.
    env.ledger().with_mut(|li| li.timestamp += 100);
    let result = client.submit_sequence(&game_id, &player, &pattern);

    let time_left = (ROUND_TIME_LIMIT_SECS - 100) as u32;
    let expected = pattern_len * POINTS_PER_STEP + COMPLETION_BONUS + time_left;
    assert_eq!(result.status, GameStatus::Completed);
    assert_eq!(result.correct_steps, pattern_len);
    assert_eq!(result.score, expected);
    assert_eq!(client.get_high_score(&player), expected);

    let board = client.get_leaderboard();
    assert_eq!(board.len(), 1);
    assert_eq!(board.get(0).unwrap().score, expected);
}

#[test]
fn wrong_step_fails_round_and_scores_prefix() {
    let (env, client, player) = setup();

    let game_id = client.start_game(&player, &4, &1);
    let pattern = client.get_round_pattern(&game_id);

    // Corrupt the third step; first two remain correct.
    let mut steps = Vec::new(&env);
    steps.push_back(pattern.get(0).unwrap());
    steps.push_back(pattern.get(1).unwrap());
    steps.push_back((pattern.get(2).unwrap() + 1) % 16);

    let result = client.submit_sequence(&game_id, &player, &steps);
    assert_eq!(result.status, GameStatus::Failed);
    assert_eq!(result.correct_steps, 2);
    assert_eq!(result.score, 2 * POINTS_PER_STEP);

    // Round is terminated: a corrected retry is rejected.
    let retry = client.try_submit_sequence(&game_id, &player, &pattern);
    assert_eq!(retry, Err(Ok(Error::RoundClosed)));
}

#[test]
fn truncated_submission_is_not_a_completion() {
    let (env, client, player) = setup();

    let game_id = client.start_game(&player, &3, &1);
    let pattern = client.get_round_pattern(&game_id);

    let mut prefix = Vec::new(&env);
    prefix.push_back(pattern.get(0).unwrap());
    prefix.push_back(pattern.get(1).unwrap());

    let result = client.submit_sequence(&game_id, &player, &prefix);
    assert_eq!(result.status, GameStatus::Failed);
    assert_eq!(result.correct_steps, 2);
    assert_eq!(result.score, 2 * POINTS_PER_STEP);
}

#[test]
fn overdue_submission_is_rejected() {
    let (env, client, player) = setup();

    let game_id = client.start_game(&player, &4, &1);
    let pattern = client.get_round_pattern(&game_id);

    env.ledger()
        .with_mut(|li| li.timestamp += ROUND_TIME_LIMIT_SECS + 1);
    let result = client.try_submit_sequence(&game_id, &player, &pattern);
    assert_eq!(result, Err(Ok(Error::RoundExpired)));
}

#[test]
fn submission_at_exact_deadline_is_accepted() {
    let (env, client, player) = setup();

    let game_id = client.start_game(&player, &4, &1);
    let pattern = client.get_round_pattern(&game_id);

    env.ledger()
        .with_mut(|li| li.timestamp += ROUND_TIME_LIMIT_SECS);
    let result = client.submit_sequence(&game_id, &player, &pattern);
    assert_eq!(result.status, GameStatus::Completed);
    // Deadline reached: no seconds left, so no time bonus.
    assert_eq!(
        result.score,
        pattern.len() * POINTS_PER_STEP + COMPLETION_BONUS
    );
}

#[test]
fn only_the_round_player_may_submit() {
    let (env, client, player) = setup();
    let intruder = Address::generate(&env);

    let game_id = client.start_game(&player, &4, &1);
    let pattern = client.get_round_pattern(&game_id);

    let result = client.try_submit_sequence(&game_id, &intruder, &pattern);
    assert_eq!(result, Err(Ok(Error::NotGamePlayer)));
}

#[test]
fn invalid_parameters_are_rejected() {
    let (_env, client, player) = setup();

    assert_eq!(
        client.try_start_game(&player, &1, &1),
        Err(Ok(Error::InvalidGridSize))
    );
    assert_eq!(
        client.try_start_game(&player, &9, &1),
        Err(Ok(Error::InvalidGridSize))
    );
    assert_eq!(
        client.try_start_game(&player, &4, &0),
        Err(Ok(Error::InvalidDifficulty))
    );
    assert_eq!(
        client.try_start_game(&player, &4, &6),
        Err(Ok(Error::InvalidDifficulty))
    );
}

#[test]
fn empty_submission_is_rejected() {
    let (env, client, player) = setup();

    let game_id = client.start_game(&player, &4, &1);
    let empty = Vec::new(&env);
    let result = client.try_submit_sequence(&game_id, &player, &empty);
    assert_eq!(result, Err(Ok(Error::EmptySubmission)));
}

#[test]
fn unknown_game_is_rejected() {
    let (env, client, player) = setup();

    let mut steps = Vec::new(&env);
    steps.push_back(0);
    assert_eq!(
        client.try_submit_sequence(&99, &player, &steps),
        Err(Ok(Error::GameNotFound))
    );
    assert_eq!(client.try_get_game_state(&99), Err(Ok(Error::GameNotFound)));
    assert_eq!(
        client.try_get_round_pattern(&99),
        Err(Ok(Error::GameNotFound))
    );
}

#[test]
fn high_score_keeps_best_and_leaderboard_sorts() {
    let (env, client, player) = setup();
    let rival = Address::generate(&env);

    // Player completes a difficulty 1 round quickly (high score).
    let g1 = client.start_game(&player, &4, &1);
    let p1 = client.get_round_pattern(&g1);
    env.ledger().with_mut(|li| li.timestamp += 10);
    let r1 = client.submit_sequence(&g1, &player, &p1);

    // Rival fails a round after two correct steps (low score).
    let g2 = client.start_game(&rival, &4, &1);
    let p2 = client.get_round_pattern(&g2);
    let mut bad = Vec::new(&env);
    bad.push_back(p2.get(0).unwrap());
    bad.push_back((p2.get(1).unwrap() + 1) % 16);
    let r2 = client.submit_sequence(&g2, &rival, &bad);
    assert!(r2.score < r1.score);

    // Player fails another round: high score must keep the earlier best.
    let g3 = client.start_game(&player, &4, &1);
    let p3 = client.get_round_pattern(&g3);
    let mut bad3 = Vec::new(&env);
    bad3.push_back((p3.get(0).unwrap() + 1) % 16);
    client.submit_sequence(&g3, &player, &bad3);
    assert_eq!(client.get_high_score(&player), r1.score);

    let board = client.get_leaderboard();
    assert_eq!(board.get(0).unwrap().player, player);
    assert_eq!(board.get(0).unwrap().score, r1.score);
    // Descending order across all entries.
    for i in 1..board.len() {
        assert!(board.get(i - 1).unwrap().score >= board.get(i).unwrap().score);
    }
}
