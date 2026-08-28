//! Stellarcade Tournament Brackets Contract (experimental)
//!
//! On-chain single-elimination bracket state for power-of-2 player counts
//! (4, 8, 16, 32). Round 0 is seeded traditionally (seed 1 vs seed N, seed 2
//! vs seed N-1, ...); recording a match's winner automatically slots them
//! into the correct match of the next round, and the finals winner is
//! crowned champion.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, Vec};

pub use types::{BracketTreeSummary, MatchupPair};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    InvalidPlayerCount = 1,
    BracketNotFound = 2,
    InvalidRoundOrMatch = 3,
    MatchAlreadyDecided = 4,
    MatchNotReady = 5,
    WinnerNotInMatch = 6,
    BracketAlreadyFinalized = 7,
}

#[contract]
pub struct TournamentBrackets;

#[contractimpl]
impl TournamentBrackets {
    /// Create a bracket for `player_seeds`, seeded traditionally (index 0
    /// plays the last index, index 1 plays the second-to-last, ...).
    /// `player_seeds.len()` must be a power of 2 in {4, 8, 16, 32}.
    /// Only `admin` may report match results for this bracket.
    pub fn create_bracket(
        env: Env,
        admin: Address,
        player_seeds: Vec<Address>,
    ) -> Result<u64, Error> {
        admin.require_auth();

        let player_count = player_seeds.len();
        if !matches!(player_count, 4 | 8 | 16 | 32) {
            return Err(Error::InvalidPlayerCount);
        }

        let bracket_id = storage::read_next_bracket_id(&env);
        storage::write_next_bracket_id(&env, bracket_id + 1);

        storage::write_bracket_admin(&env, bracket_id, &admin);
        storage::write_player_count(&env, bracket_id, player_count);

        let round_count = player_count.trailing_zeros();
        storage::write_round_count(&env, bracket_id, round_count);

        // Round 0: traditional seeding, 1 vs N, 2 vs N-1, ...
        let match_count = player_count / 2;
        let mut round0 = Vec::new(&env);
        for match_idx in 0..match_count {
            let player_a = player_seeds.get(match_idx).unwrap();
            let player_b = player_seeds.get(player_count - 1 - match_idx).unwrap();
            round0.push_back(MatchupPair {
                round_idx: 0,
                match_idx,
                player_a: Some(player_a),
                player_b: Some(player_b),
                winner: None,
            });
        }
        storage::write_round(&env, bracket_id, 0, &round0);

        // Later rounds start empty (both players TBD) until their feeder
        // matches resolve.
        let mut round_size = match_count / 2;
        let mut round_idx = 1;
        while round_idx < round_count {
            let mut round = Vec::new(&env);
            for match_idx in 0..round_size {
                round.push_back(MatchupPair {
                    round_idx,
                    match_idx,
                    player_a: None,
                    player_b: None,
                    winner: None,
                });
            }
            storage::write_round(&env, bracket_id, round_idx, &round);
            round_size /= 2;
            round_idx += 1;
        }

        Ok(bracket_id)
    }

    /// Record the winner of `(round_idx, match_idx)`. Only the bracket's
    /// admin may report results. Automatically slots the winner into the
    /// next round's matchup, or crowns them champion if this was the
    /// finals.
    pub fn record_match_result(
        env: Env,
        bracket_id: u64,
        round_idx: u32,
        match_idx: u32,
        winner_address: Address,
    ) -> Result<(), Error> {
        let admin = storage::read_bracket_admin(&env, bracket_id).ok_or(Error::BracketNotFound)?;
        admin.require_auth();

        if storage::read_champion(&env, bracket_id).is_some() {
            return Err(Error::BracketAlreadyFinalized);
        }

        let round_count = storage::read_round_count(&env, bracket_id);
        if round_idx >= round_count {
            return Err(Error::InvalidRoundOrMatch);
        }

        let mut round = storage::read_round(&env, bracket_id, round_idx);
        if match_idx >= round.len() {
            return Err(Error::InvalidRoundOrMatch);
        }

        let mut matchup = round.get(match_idx).unwrap();
        if matchup.winner.is_some() {
            return Err(Error::MatchAlreadyDecided);
        }
        let (player_a, player_b) = match (&matchup.player_a, &matchup.player_b) {
            (Some(a), Some(b)) => (a.clone(), b.clone()),
            _ => return Err(Error::MatchNotReady),
        };
        if winner_address != player_a && winner_address != player_b {
            return Err(Error::WinnerNotInMatch);
        }

        matchup.winner = Some(winner_address.clone());
        round.set(match_idx, matchup);
        storage::write_round(&env, bracket_id, round_idx, &round);

        let next_round_idx = round_idx + 1;
        if next_round_idx >= round_count {
            // This was the finals — crown the champion.
            storage::write_champion(&env, bracket_id, &winner_address);
            return Ok(());
        }

        // Slot the winner into the next round: match_idx / 2, as player_a
        // if match_idx is even, player_b if odd.
        let mut next_round = storage::read_round(&env, bracket_id, next_round_idx);
        let next_match_idx = match_idx / 2;
        let mut next_matchup = next_round.get(next_match_idx).unwrap();
        if match_idx.is_multiple_of(2) {
            next_matchup.player_a = Some(winner_address);
        } else {
            next_matchup.player_b = Some(winner_address);
        }
        next_round.set(next_match_idx, next_matchup);
        storage::write_round(&env, bracket_id, next_round_idx, &next_round);

        Ok(())
    }

    /// Full bracket tree, every round from first to finals.
    pub fn get_bracket_tree(env: Env, bracket_id: u64) -> Result<BracketTreeSummary, Error> {
        let admin = storage::read_bracket_admin(&env, bracket_id).ok_or(Error::BracketNotFound)?;
        let player_count = storage::read_player_count(&env, bracket_id);
        let round_count = storage::read_round_count(&env, bracket_id);

        let mut rounds = Vec::new(&env);
        for round_idx in 0..round_count {
            rounds.push_back(storage::read_round(&env, bracket_id, round_idx));
        }

        let champion = storage::read_champion(&env, bracket_id);
        Ok(BracketTreeSummary {
            bracket_id,
            admin,
            player_count,
            round_count,
            rounds,
            is_finalized: champion.is_some(),
            champion,
        })
    }

    /// Matchups that currently have both players assigned but no winner
    /// recorded yet, across all rounds.
    pub fn get_active_matches(env: Env, bracket_id: u64) -> Result<Vec<MatchupPair>, Error> {
        if storage::read_bracket_admin(&env, bracket_id).is_none() {
            return Err(Error::BracketNotFound);
        }
        let round_count = storage::read_round_count(&env, bracket_id);

        let mut active = Vec::new(&env);
        for round_idx in 0..round_count {
            let round = storage::read_round(&env, bracket_id, round_idx);
            for matchup in round.iter() {
                if matchup.winner.is_none()
                    && matchup.player_a.is_some()
                    && matchup.player_b.is_some()
                {
                    active.push_back(matchup);
                }
            }
        }
        Ok(active)
    }
}
