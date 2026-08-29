#![cfg(test)]

use soroban_sdk::{testutils::Address as _, vec, Address, BytesN, Env};

use crate::{Bet, BetType, RouletteMini, RouletteMiniClient};

const MIN_BET: u128 = 1;
const MAX_BET: u128 = 1_000;
const BANKROLL: u128 = 100_000;

fn setup() -> (Env, RouletteMiniClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(RouletteMini, ());
    let client = RouletteMiniClient::new(&env, &contract_id);
    client.initialize(&MIN_BET, &MAX_BET, &BANKROLL);
    (env, client)
}

/// First 8 bytes encode `n` so `n % 37 == n` for n in 0..=36.
fn seed_for(env: &Env, n: u32) -> BytesN<32> {
    let mut bytes = [0u8; 32];
    bytes[0..8].copy_from_slice(&(n as u64).to_be_bytes());
    BytesN::from_array(env, &bytes)
}

#[test]
fn straight_up_win_pays_35_to_1() {
    let (env, client) = setup();
    let player = Address::generate(&env);
    let bets = vec![
        &env,
        Bet {
            bet_type: BetType::Straight,
            numbers: vec![&env, 17u32],
            amount: 10,
        },
    ];
    let round = client.place_bets(&player, &bets);
    let result = client.spin_wheel(&round, &seed_for(&env, 17));
    assert_eq!(result.winning_number, 17);
    // 35:1 plus stake = 36x.
    assert_eq!(result.total_payout, 360);
}

#[test]
fn red_black_win_and_loss() {
    let (env, client) = setup();
    let player = Address::generate(&env);

    // 1 is red — even-money win is 2x stake.
    let red = vec![
        &env,
        Bet {
            bet_type: BetType::Red,
            numbers: vec![&env],
            amount: 10,
        },
    ];
    let round = client.place_bets(&player, &red);
    let win = client.spin_wheel(&round, &seed_for(&env, 1));
    assert!(win.is_red);
    assert_eq!(win.total_payout, 20);

    // 2 is black — red bet loses.
    let round = client.place_bets(&player, &red);
    let loss = client.spin_wheel(&round, &seed_for(&env, 2));
    assert!(!loss.is_red);
    assert_eq!(loss.total_payout, 0);
}

#[test]
fn zero_spin_house_wins_outside_bets() {
    let (env, client) = setup();
    let player = Address::generate(&env);
    let bets = vec![
        &env,
        Bet {
            bet_type: BetType::Red,
            numbers: vec![&env],
            amount: 10,
        },
        Bet {
            bet_type: BetType::Black,
            numbers: vec![&env],
            amount: 10,
        },
        Bet {
            bet_type: BetType::Odd,
            numbers: vec![&env],
            amount: 10,
        },
        Bet {
            bet_type: BetType::Even,
            numbers: vec![&env],
            amount: 10,
        },
    ];
    let round = client.place_bets(&player, &bets);
    let result = client.spin_wheel(&round, &seed_for(&env, 0));
    assert_eq!(result.winning_number, 0);
    assert_eq!(result.total_payout, 0);
    assert_eq!(result.house_rake, 40);
}
