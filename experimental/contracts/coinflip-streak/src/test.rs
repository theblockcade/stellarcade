#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};

#[test]
fn test_three_win_streak_then_cashout() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CoinflipStreakContract, ());
    let client = CoinflipStreakContractClient::new(&env, &contract_id);

    let player = Address::generate(&env);
    // byte[0] == 0 -> heads.
    let win_seed = BytesN::from_array(&env, &[0u8; 32]);

    let state = client.start_streak(&player, &1000u128, &true, &win_seed);
    assert_eq!(state.streak_count, 1);
    assert_eq!(state.current_value, 1950); // 1000 * 1.95x (19500 bps) / 10000

    let state = client.continue_flip(&state.streak_id, &player, &true, &win_seed);
    assert_eq!(state.streak_count, 2);
    assert_eq!(state.current_value, 3800); // 1000 * 3.8x

    let state = client.continue_flip(&state.streak_id, &player, &true, &win_seed);
    assert_eq!(state.streak_count, 3);
    assert_eq!(state.current_value, 7500); // 1000 * 7.5x

    let payout = client.cashout_streak(&state.streak_id, &player);
    assert_eq!(payout, 7500);

    let summary = client.get_streak_status(&state.streak_id);
    assert_eq!(summary.phase, StreakPhase::CashedOut);
    assert_eq!(summary.max_streak, MAX_STREAK);
}

#[test]
fn test_second_flip_loss_forfeits_wager() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CoinflipStreakContract, ());
    let client = CoinflipStreakContractClient::new(&env, &contract_id);

    let player = Address::generate(&env);
    let win_seed = BytesN::from_array(&env, &[0u8; 32]);
    // byte[0] == 1 -> tails, mismatches a "heads" call to produce a loss.
    let loss_seed = BytesN::from_array(&env, &[1u8; 32]);

    let state = client.start_streak(&player, &1000u128, &true, &win_seed);
    assert_eq!(state.streak_count, 1);

    let state = client.continue_flip(&state.streak_id, &player, &true, &loss_seed);
    assert_eq!(state.streak_count, 0);
    assert_eq!(state.current_value, 0);
    assert_eq!(state.phase, StreakPhase::Lost);

    let summary = client.get_streak_status(&state.streak_id);
    assert_eq!(summary.phase, StreakPhase::Lost);
    assert_eq!(summary.current_value, 0);
}

#[test]
#[should_panic(expected = "max streak cap reached")]
fn test_max_streak_cap_enforcement() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(CoinflipStreakContract, ());
    let client = CoinflipStreakContractClient::new(&env, &contract_id);

    let player = Address::generate(&env);
    let win_seed = BytesN::from_array(&env, &[0u8; 32]);

    let mut state = client.start_streak(&player, &1000u128, &true, &win_seed);
    // Keep winning up to the ladder's max streak (4 consecutive wins).
    for _ in 1..MAX_STREAK {
        state = client.continue_flip(&state.streak_id, &player, &true, &win_seed);
    }
    assert_eq!(state.streak_count, MAX_STREAK);

    // A 5th flip attempt is rejected — the player must cash out instead.
    client.continue_flip(&state.streak_id, &player, &true, &win_seed);
}
