//! Stellarcade Roulette Mini Contract (experimental)
//!
//! Single-zero European roulette. Players place structured inside and
//! outside bets against table limits and house bankroll; a caller-supplied
//! seed resolves the wheel to `0..=36` and exact integer payouts are
//! credited (35:1 straight, 17:1 split, 1:1 even-money, 2:1 column/dozen).

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, BytesN, Env, Vec};

pub use types::{Bet, BetType, RoundRecord, SpinResult, TableLimitSummary};

/// European red numbers.
const RED: [u32; 18] = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidLimits = 3,
    EmptyBets = 4,
    BetBelowMinimum = 5,
    BetAboveMaximum = 6,
    BankrollExceeded = 7,
    InvalidBet = 8,
    RoundNotFound = 9,
    RoundAlreadyResolved = 10,
    MathOverflow = 11,
}

#[contract]
pub struct RouletteMini;

#[contractimpl]
impl RouletteMini {
    /// One-time table setup: bet bounds and starting house bankroll.
    pub fn initialize(
        env: Env,
        min_bet: u128,
        max_bet: u128,
        bankroll: u128,
    ) -> Result<(), Error> {
        if storage::is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }
        if min_bet == 0 || max_bet < min_bet || bankroll == 0 {
            return Err(Error::InvalidLimits);
        }
        storage::write_limits(&env, min_bet, max_bet, bankroll);
        Ok(())
    }

    /// Escrow a round of bets. Returns the new `round_id`.
    pub fn place_bets(env: Env, player: Address, bets: Vec<Bet>) -> Result<u64, Error> {
        player.require_auth();
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }
        if bets.is_empty() {
            return Err(Error::EmptyBets);
        }

        let min_bet = storage::read_min_bet(&env);
        let max_bet = storage::read_max_bet(&env);
        let bankroll = storage::read_bankroll(&env);

        let mut total_wager: u128 = 0;
        let mut max_payout: u128 = 0;
        for bet in bets.iter() {
            validate_bet(&bet)?;
            if bet.amount < min_bet {
                return Err(Error::BetBelowMinimum);
            }
            if bet.amount > max_bet {
                return Err(Error::BetAboveMaximum);
            }
            total_wager = total_wager
                .checked_add(bet.amount)
                .ok_or(Error::MathOverflow)?;
            max_payout = max_payout
                .checked_add(payout_if_win(&bet)?)
                .ok_or(Error::MathOverflow)?;
        }

        // House must cover worst-case winnings from current bankroll + this
        // round's incoming wagers.
        let coverage = bankroll
            .checked_add(total_wager)
            .ok_or(Error::MathOverflow)?;
        if max_payout > coverage {
            return Err(Error::BankrollExceeded);
        }

        let id = storage::next_round_id(&env);
        storage::write_round(
            &env,
            &types::Round {
                id,
                player,
                bets,
                total_wager,
                resolved: false,
                winning_number: 0,
            },
        );
        Ok(id)
    }

    /// Resolve `round_id` with `random_seed` mapped onto `0..=36`.
    pub fn spin_wheel(
        env: Env,
        round_id: u64,
        random_seed: BytesN<32>,
    ) -> Result<SpinResult, Error> {
        let mut round = storage::read_round(&env, round_id).ok_or(Error::RoundNotFound)?;
        if round.resolved {
            return Err(Error::RoundAlreadyResolved);
        }

        let winning_number = seed_to_pocket(&random_seed);
        let mut total_payout: u128 = 0;
        for bet in round.bets.iter() {
            if bet_hits(&bet, winning_number) {
                total_payout = total_payout
                    .checked_add(payout_if_win(&bet)?)
                    .ok_or(Error::MathOverflow)?;
            }
        }

        let bankroll = storage::read_bankroll(&env)
            .checked_add(round.total_wager)
            .ok_or(Error::MathOverflow)?;
        let (new_bankroll, house_rake_delta) = if total_payout > bankroll {
            return Err(Error::BankrollExceeded);
        } else if total_payout <= round.total_wager {
            (
                bankroll - total_payout,
                round.total_wager - total_payout,
            )
        } else {
            (bankroll - total_payout, 0)
        };
        storage::write_bankroll(&env, new_bankroll);
        storage::write_house_rake(&env, storage::read_house_rake(&env) + house_rake_delta);

        round.resolved = true;
        round.winning_number = winning_number;
        storage::write_round(&env, &round);

        let record = RoundRecord {
            round_id,
            winning_number,
            total_wager: round.total_wager,
            total_payout,
        };
        let mut history = storage::read_history(&env, &round.player);
        history.push_back(record);
        storage::write_history(&env, &round.player, &history);

        Ok(SpinResult {
            round_id,
            winning_number,
            is_red: is_red(winning_number),
            total_payout,
            house_rake: house_rake_delta,
        })
    }

    pub fn get_table_limits(env: Env) -> Result<TableLimitSummary, Error> {
        if !storage::is_initialized(&env) {
            return Err(Error::NotInitialized);
        }
        Ok(TableLimitSummary {
            min_bet: storage::read_min_bet(&env),
            max_bet: storage::read_max_bet(&env),
            bankroll: storage::read_bankroll(&env),
        })
    }

    pub fn get_player_round_history(env: Env, player: Address) -> Vec<RoundRecord> {
        storage::read_history(&env, &player)
    }
}

fn seed_to_pocket(seed: &BytesN<32>) -> u32 {
    let bytes = seed.to_array();
    let mut val: u64 = 0;
    for b in &bytes[0..8] {
        val = (val << 8) | *b as u64;
    }
    (val % 37) as u32
}

fn is_red(n: u32) -> bool {
    RED.contains(&n)
}

fn validate_bet(bet: &Bet) -> Result<(), Error> {
    if bet.amount == 0 {
        return Err(Error::InvalidBet);
    }
    match bet.bet_type {
        BetType::Straight => {
            if bet.numbers.len() != 1 {
                return Err(Error::InvalidBet);
            }
            let n = bet.numbers.get(0).unwrap();
            if n > 36 {
                return Err(Error::InvalidBet);
            }
        }
        BetType::Split => {
            if bet.numbers.len() != 2 {
                return Err(Error::InvalidBet);
            }
            let a = bet.numbers.get(0).unwrap();
            let b = bet.numbers.get(1).unwrap();
            if a > 36 || b > 36 || a == b {
                return Err(Error::InvalidBet);
            }
        }
        BetType::Red | BetType::Black | BetType::Odd | BetType::Even => {}
        BetType::Column | BetType::Dozen => {
            if bet.numbers.len() != 1 {
                return Err(Error::InvalidBet);
            }
            let n = bet.numbers.get(0).unwrap();
            if !(1..=3).contains(&n) {
                return Err(Error::InvalidBet);
            }
        }
    }
    Ok(())
}

/// Full return including stake: 35:1 -> 36x, 1:1 -> 2x, 2:1 -> 3x, 17:1 -> 18x.
fn payout_if_win(bet: &Bet) -> Result<u128, Error> {
    let mult: u128 = match bet.bet_type {
        BetType::Straight => 36,
        BetType::Split => 18,
        BetType::Red | BetType::Black | BetType::Odd | BetType::Even => 2,
        BetType::Column | BetType::Dozen => 3,
    };
    bet.amount.checked_mul(mult).ok_or(Error::MathOverflow)
}

fn bet_hits(bet: &Bet, n: u32) -> bool {
    match bet.bet_type {
        BetType::Straight => bet.numbers.get(0).unwrap() == n,
        BetType::Split => {
            bet.numbers.get(0).unwrap() == n || bet.numbers.get(1).unwrap() == n
        }
        BetType::Red => is_red(n),
        BetType::Black => n != 0 && !is_red(n),
        BetType::Odd => n != 0 && n % 2 == 1,
        BetType::Even => n != 0 && n % 2 == 0,
        BetType::Column => {
            let col = bet.numbers.get(0).unwrap();
            n != 0 && ((n - 1) % 3) + 1 == col
        }
        BetType::Dozen => {
            let dozen = bet.numbers.get(0).unwrap();
            n != 0 && (n - 1) / 12 + 1 == dozen
        }
    }
}
