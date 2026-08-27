//! Stellarcade Coinflip Streak Contract (experimental)
//!
//! Players wager on consecutive coinflips. Each win advances the streak
//! one rung up a fixed payout ladder (1.95x -> 3.8x -> 7.5x -> 15x); a
//! wrong guess at any point ends the streak immediately with zero payout.
//! A player may cash out after any winning flip to lock in the current
//! ladder value, or keep flipping up to the ladder's max streak.
//!
//! Randomness: the winning side is derived from the low byte of the
//! caller-supplied `random_seed` (`byte[0] % 2 == 0` -> heads), matching
//! the auditable, caller-supplied-seed pattern used by the jackpot
//! distributor contract elsewhere in this experimental workspace. A
//! production version would source this from a VRF/oracle instead.

#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env};
use types::{StreakPhase, StreakState, StreakSummary};

/// Payout multiplier per consecutive win, in basis points (10000 = 1.00x):
/// win 1 -> 1.95x, win 2 -> 3.8x, win 3 -> 7.5x, win 4 -> 15x.
pub const MULTIPLIER_LADDER_BPS: [u32; 4] = [19_500, 38_000, 75_000, 150_000];
/// Streak length at which the ladder tops out; players must cash out here.
pub const MAX_STREAK: u32 = 4;

#[contract]
pub struct CoinflipStreakContract;

impl CoinflipStreakContract {
    fn flip_is_heads(seed: &BytesN<32>) -> bool {
        seed.to_array()[0] % 2 == 0
    }

    fn value_for_streak(wager_amount: u128, streak_count: u32) -> u128 {
        let bps = MULTIPLIER_LADDER_BPS[(streak_count - 1) as usize];
        (wager_amount.saturating_mul(bps as u128)) / 10_000
    }

    fn require_owned_active_streak(state: &StreakState, player: &Address) {
        if state.player != *player {
            panic!("streak does not belong to this player");
        }
        if state.phase != StreakPhase::Active {
            panic!("streak is not active");
        }
    }
}

#[contractimpl]
impl CoinflipStreakContract {
    /// Starts a new streak session: locks in `wager_amount` and resolves
    /// the first flip against `choice_heads` immediately.
    pub fn start_streak(
        env: Env,
        player: Address,
        wager_amount: u128,
        choice_heads: bool,
        random_seed: BytesN<32>,
    ) -> StreakState {
        player.require_auth();

        if wager_amount == 0 {
            panic!("wager_amount must be greater than 0");
        }

        let streak_id = storage::get_next_streak_id(&env);
        storage::set_next_streak_id(&env, streak_id + 1);

        let won = Self::flip_is_heads(&random_seed) == choice_heads;
        let (streak_count, current_value, phase) = if won {
            (1u32, Self::value_for_streak(wager_amount, 1), StreakPhase::Active)
        } else {
            (0u32, 0u128, StreakPhase::Lost)
        };

        let state = StreakState {
            streak_id,
            player,
            wager_amount,
            streak_count,
            current_value,
            phase,
        };
        storage::set_streak(&env, &state);
        state
    }

    /// Resolves the next flip of an active streak. A win advances the
    /// streak and recomputes the cashout value from the ladder; a loss
    /// ends the streak with zero payout.
    pub fn continue_flip(
        env: Env,
        streak_id: u64,
        player: Address,
        choice_heads: bool,
        random_seed: BytesN<32>,
    ) -> StreakState {
        player.require_auth();

        let mut state = storage::get_streak(&env, streak_id).expect("streak not found");
        Self::require_owned_active_streak(&state, &player);

        if state.streak_count >= MAX_STREAK {
            panic!("max streak cap reached; cash out to continue");
        }

        let won = Self::flip_is_heads(&random_seed) == choice_heads;
        if won {
            state.streak_count += 1;
            state.current_value = Self::value_for_streak(state.wager_amount, state.streak_count);
        } else {
            state.streak_count = 0;
            state.current_value = 0;
            state.phase = StreakPhase::Lost;
        }

        storage::set_streak(&env, &state);
        state
    }

    /// Closes an active, at-least-one-win streak and returns the fully
    /// accumulated winnings at the current ladder rung.
    pub fn cashout_streak(env: Env, streak_id: u64, player: Address) -> u128 {
        player.require_auth();

        let mut state = storage::get_streak(&env, streak_id).expect("streak not found");
        Self::require_owned_active_streak(&state, &player);

        if state.streak_count == 0 {
            panic!("no winning flip to cash out yet");
        }

        let payout = state.current_value;
        state.phase = StreakPhase::CashedOut;
        storage::set_streak(&env, &state);

        payout
    }

    /// Read-only snapshot of a streak session.
    pub fn get_streak_status(env: Env, streak_id: u64) -> StreakSummary {
        let state = storage::get_streak(&env, streak_id).expect("streak not found");
        StreakSummary {
            streak_id: state.streak_id,
            player: state.player,
            wager_amount: state.wager_amount,
            streak_count: state.streak_count,
            current_value: state.current_value,
            phase: state.phase,
            max_streak: MAX_STREAK,
        }
    }
}

#[cfg(test)]
mod test;
