//! Stellarcade Coin Flip Contract
//!
//! Implements the classic 50/50 game logic.
#![no_std]
#![allow(unexpected_cfgs)]

use soroban_sdk::{contract, contractevent, contractimpl, Address, BytesN, Env};

/// Emitted after each coin flip play is resolved.
#[contractevent]
pub struct CoinFlipPlayed {
    pub player: Address,
    pub amount: i128,
    pub choice: u32,
}

#[contract]
pub struct CoinFlip;

#[contractimpl]
impl CoinFlip {
    /// Play the coin flip game.
    pub fn play(env: Env, player: Address, amount: i128, choice: u32, _seed: BytesN<32>) {
        player.require_auth();
        // TODO: Call PrizePool to lock/deposit amount
        // TODO: Call RandomGenerator to get result
        // TODO: Determine if choice (0 or 1) matches result
        // TODO: If win, call PrizePool to pay out win amount
        CoinFlipPlayed {
            player: player.clone(),
            amount,
            choice,
        }
        .publish(&env);
    }

    /// View previous game result for verification.
    pub fn get_game_result(_env: Env, _game_id: u32) -> u32 {
        // TODO: Retrieve result from storage
        0
    }
}
