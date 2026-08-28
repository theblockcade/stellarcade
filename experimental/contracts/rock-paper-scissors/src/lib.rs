//! Stellarcade Rock-Paper-Scissors Duel Contract (experimental)
//!
//! Two-player commit-reveal Rock-Paper-Scissors with wager escrow:
//! player1 creates a match with a wager and a `sha256(move_be_bytes || salt)`
//! commitment; player2 joins with a matched wager and their own commitment.
//! Both players then reveal their plaintext move and salt to prove their
//! commitment, and the contract evaluates the winner and disburses the pot.
//!
//! ## Commit-reveal
//! Neither player can see the other's move before both have committed
//! (joining *is* committing here — there is no separate commit step), so
//! neither side can react to the opponent's choice. Reveal only requires
//! that the match has both players committed; there is no reveal-ordering
//! dependency the way trivia-duel has (a single round has no "opponent
//! commit yet" wait needed once both commitments exist).
//!
//! ## Settlement
//! `Rock` beats `Scissors`, `Scissors` beats `Paper`, `Paper` beats `Rock`.
//! A tie (matching moves) refunds both wagers, no fee taken. The winner
//! receives the full pot minus the protocol fee (`fee_bps`).
//!
//! ## Timeout forfeits
//! If one player reveals and the other fails to reveal before
//! `reveal_deadline`, the revealed player can claim victory by forfeit via
//! [`RockPaperScissors::claim_timeout`]. If *neither* player reveals before
//! the deadline, either player may call `claim_timeout` to trigger a mutual
//! refund (no forfeit winner, since neither party proved their commitment).

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, Bytes, BytesN, Env};

pub use types::{CommitSlot, Match, MatchResult, MatchStatus, MatchSummary, Move, MoveCommit};

/// Commit window granted to player2 to join after creation, in seconds.
pub const COMMIT_WINDOW_SECONDS: u64 = 600;
/// Reveal window granted once both players have committed, in seconds.
pub const REVEAL_WINDOW_SECONDS: u64 = 300;
/// Upper bound on the protocol fee (10%).
pub const MAX_FEE_BPS: u32 = 1_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    FeeTooHigh = 3,
    InvalidWager = 4,
    MatchNotFound = 5,
    NotJoinable = 6,
    CannotDuelSelf = 7,
    WagerMismatch = 8,
    JoinWindowClosed = 9,
    NotMatchPlayer = 10,
    MatchNotCommitted = 11,
    NothingToReveal = 12,
    AlreadyRevealed = 13,
    InvalidReveal = 14,
    RevealWindowOpen = 15,
    NoRevealsYet = 16,
    MatchAlreadySettled = 17,
}

#[contract]
pub struct RockPaperScissors;

#[contractimpl]
impl RockPaperScissors {
    /// One-time setup: the wager token and the protocol fee in basis points
    /// (max [`MAX_FEE_BPS`]).
    pub fn initialize(env: Env, token: Address, fee_bps: u32) -> Result<(), Error> {
        if storage::read_token(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        if fee_bps > MAX_FEE_BPS {
            return Err(Error::FeeTooHigh);
        }
        storage::write_token(&env, &token);
        storage::write_fee_bps(&env, fee_bps);
        Ok(())
    }

    /// Open a match: player1 escrows `wager_amount` and commits their move
    /// hash. Returns the new match id.
    pub fn create_match(
        env: Env,
        player: Address,
        wager_amount: i128,
        commitment: BytesN<32>,
    ) -> Result<u64, Error> {
        player.require_auth();
        let token = storage::read_token(&env).ok_or(Error::NotInitialized)?;
        if wager_amount <= 0 {
            return Err(Error::InvalidWager);
        }

        token::Client::new(&env, &token).transfer(
            &player,
            env.current_contract_address(),
            &wager_amount,
        );

        let now = env.ledger().timestamp();
        let id = storage::next_match_id(&env);
        storage::write_match(
            &env,
            &Match {
                id,
                player1: player.clone(),
                player2: None,
                wager: wager_amount,
                status: MatchStatus::AwaitingChallenger,
                started_at: 0,
                commit_deadline: now + COMMIT_WINDOW_SECONDS,
                reveal_deadline: 0,
            },
        );
        storage::write_commit(
            &env,
            id,
            &player,
            &MoveCommit {
                move_hash: commitment,
                committed_at: now,
                revealed: false,
                move_val: Move::Rock, // placeholder until revealed
            },
        );
        Ok(id)
    }

    /// Join an open match: player2 escrows a matched wager and commits their
    /// move hash, opening the reveal window for both players.
    pub fn join_match(
        env: Env,
        match_id: u64,
        player: Address,
        commitment: BytesN<32>,
    ) -> Result<(), Error> {
        player.require_auth();
        let mut m = storage::read_match(&env, match_id).ok_or(Error::MatchNotFound)?;
        if m.status != MatchStatus::AwaitingChallenger {
            return Err(Error::NotJoinable);
        }
        if player == m.player1 {
            return Err(Error::CannotDuelSelf);
        }
        let now = env.ledger().timestamp();
        if now > m.commit_deadline {
            return Err(Error::JoinWindowClosed);
        }

        let token = storage::read_token(&env).ok_or(Error::NotInitialized)?;
        token::Client::new(&env, &token).transfer(
            &player,
            env.current_contract_address(),
            &m.wager,
        );

        m.player2 = Some(player.clone());
        m.status = MatchStatus::Committed;
        m.started_at = now;
        m.reveal_deadline = now + REVEAL_WINDOW_SECONDS;
        storage::write_match(&env, &m);
        storage::write_commit(
            &env,
            match_id,
            &player,
            &MoveCommit {
                move_hash: commitment,
                committed_at: now,
                revealed: false,
                move_val: Move::Rock, // placeholder until revealed
            },
        );
        Ok(())
    }

    /// Reveal a committed move by supplying the plaintext choice and salt.
    ///
    /// Only valid once the match is `Committed` (both players have joined
    /// and committed) or already `Revealed` (the first reveal has happened
    /// and this is the second).
    pub fn reveal_move(
        env: Env,
        match_id: u64,
        player: Address,
        move_choice: Move,
        salt: BytesN<32>,
    ) -> Result<(), Error> {
        player.require_auth();
        let mut m = storage::read_match(&env, match_id).ok_or(Error::MatchNotFound)?;
        require_match_player(&m, &player)?;
        if m.status != MatchStatus::Committed && m.status != MatchStatus::Revealed {
            return Err(Error::MatchNotCommitted);
        }

        let mut commit =
            storage::read_commit(&env, match_id, &player).ok_or(Error::NothingToReveal)?;
        if commit.revealed {
            return Err(Error::AlreadyRevealed);
        }
        if commitment_hash(&env, move_choice, &salt) != commit.move_hash {
            return Err(Error::InvalidReveal);
        }

        commit.revealed = true;
        commit.move_val = move_choice;
        storage::write_commit(&env, match_id, &player, &commit);

        if m.status == MatchStatus::Committed {
            m.status = MatchStatus::Revealed;
            storage::write_match(&env, &m);
        }
        Ok(())
    }

    /// Resolve a match once both players have revealed. Evaluates the
    /// winner and disburses the escrowed pot.
    pub fn settle_match(env: Env, match_id: u64) -> Result<MatchResult, Error> {
        let mut m = storage::read_match(&env, match_id).ok_or(Error::MatchNotFound)?;
        if m.status != MatchStatus::Revealed {
            return Err(Error::MatchNotCommitted);
        }
        let player2 = m.player2.clone().ok_or(Error::MatchNotCommitted)?;

        let commit1 =
            storage::read_commit(&env, match_id, &m.player1).ok_or(Error::NothingToReveal)?;
        let commit2 =
            storage::read_commit(&env, match_id, &player2).ok_or(Error::NothingToReveal)?;
        if !commit1.revealed || !commit2.revealed {
            return Err(Error::NoRevealsYet);
        }

        let outcome = evaluate(commit1.move_val, commit2.move_val);
        let result = disburse(&env, &m, &player2, outcome, false)?;

        m.status = MatchStatus::Settled;
        storage::write_match(&env, &m);
        storage::write_result(&env, &result);
        Ok(result)
    }

    /// Claim a forfeit (or trigger a mutual refund) once the reveal window
    /// has closed.
    ///
    /// - If exactly one player revealed, that player wins the pot by
    ///   forfeit — callable by anyone once the deadline passes.
    /// - If both players revealed, behaves like [`RockPaperScissors::settle_match`]
    ///   (kept idempotent-friendly: a late `claim_timeout` after both
    ///   reveals still resolves correctly instead of erroring).
    /// - If neither player revealed, both wagers are refunded with no
    ///   winner and no fee — no one proved their commitment, so there is no
    ///   fair way to declare a winner.
    pub fn claim_timeout(env: Env, match_id: u64, caller: Address) -> Result<MatchResult, Error> {
        caller.require_auth();
        let mut m = storage::read_match(&env, match_id).ok_or(Error::MatchNotFound)?;
        if m.status == MatchStatus::Settled {
            return Err(Error::MatchAlreadySettled);
        }
        if m.status != MatchStatus::Committed && m.status != MatchStatus::Revealed {
            return Err(Error::MatchNotCommitted);
        }
        let player2 = m.player2.clone().ok_or(Error::MatchNotCommitted)?;

        let now = env.ledger().timestamp();
        if now <= m.reveal_deadline {
            return Err(Error::RevealWindowOpen);
        }

        let commit1 =
            storage::read_commit(&env, match_id, &m.player1).ok_or(Error::NothingToReveal)?;
        let commit2 =
            storage::read_commit(&env, match_id, &player2).ok_or(Error::NothingToReveal)?;

        let (outcome, forfeited) = match (commit1.revealed, commit2.revealed) {
            (true, true) => (evaluate(commit1.move_val, commit2.move_val), false),
            (true, false) => (Outcome::Player1Wins, true),
            (false, true) => (Outcome::Player2Wins, true),
            (false, false) => (Outcome::Tie, true), // no winner proved a move: mutual refund
        };

        let result = disburse(&env, &m, &player2, outcome, forfeited)?;

        m.status = MatchStatus::Settled;
        storage::write_match(&env, &m);
        storage::write_result(&env, &result);
        Ok(result)
    }

    /// Full match state, including commit presence/reveal status for both
    /// players.
    pub fn get_match_summary(env: Env, match_id: u64) -> Result<MatchSummary, Error> {
        let m = storage::read_match(&env, match_id).ok_or(Error::MatchNotFound)?;
        let to_slot = |commit: Option<MoveCommit>| match commit {
            Some(c) => CommitSlot::Committed(c),
            None => CommitSlot::Empty,
        };
        let player2_commit = m
            .player2
            .as_ref()
            .and_then(|p| storage::read_commit(&env, match_id, p));
        Ok(MatchSummary {
            id: m.id,
            player1: m.player1.clone(),
            player2: m.player2.clone(),
            wager: m.wager,
            status: m.status,
            player1_commit: to_slot(storage::read_commit(&env, match_id, &m.player1)),
            player2_commit: to_slot(player2_commit),
        })
    }

    /// Settlement record for a settled match.
    pub fn get_result(env: Env, match_id: u64) -> Result<MatchResult, Error> {
        storage::read_result(&env, match_id).ok_or(Error::MatchAlreadySettled)
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum Outcome {
    Player1Wins,
    Player2Wins,
    Tie,
}

fn require_match_player(m: &Match, player: &Address) -> Result<(), Error> {
    if *player == m.player1 || m.player2.as_ref() == Some(player) {
        Ok(())
    } else {
        Err(Error::NotMatchPlayer)
    }
}

/// `Rock` beats `Scissors`, `Scissors` beats `Paper`, `Paper` beats `Rock`.
fn evaluate(move1: Move, move2: Move) -> Outcome {
    if move1 == move2 {
        return Outcome::Tie;
    }
    let player1_wins = matches!(
        (move1, move2),
        (Move::Rock, Move::Scissors) | (Move::Scissors, Move::Paper) | (Move::Paper, Move::Rock)
    );
    if player1_wins {
        Outcome::Player1Wins
    } else {
        Outcome::Player2Wins
    }
}

/// Applies an [`Outcome`] to the escrowed pot: pays the winner (minus fee)
/// or refunds both wagers on a tie / double-forfeit.
fn disburse(
    env: &Env,
    m: &Match,
    player2: &Address,
    outcome: Outcome,
    forfeited: bool,
) -> Result<MatchResult, Error> {
    let token = storage::read_token(env).ok_or(Error::NotInitialized)?;
    let token_client = token::Client::new(env, &token);
    let contract = env.current_contract_address();
    let pot = m.wager * 2;

    let result = match outcome {
        Outcome::Tie => {
            token_client.transfer(&contract, &m.player1, &m.wager);
            token_client.transfer(&contract, player2, &m.wager);
            MatchResult {
                match_id: m.id,
                winner: None,
                payout: 0,
                fee: 0,
                forfeited,
            }
        }
        Outcome::Player1Wins | Outcome::Player2Wins => {
            let winner = if outcome == Outcome::Player1Wins {
                m.player1.clone()
            } else {
                player2.clone()
            };
            let fee_bps = storage::read_fee_bps(env) as i128;
            let fee = pot * fee_bps / 10_000;
            let payout = pot - fee;
            // The fee simply stays in the contract's own balance (it's
            // already there from escrow) — no admin role exists in this
            // contract to sweep it to, unlike trivia-duel. Only the
            // winner's payout portion needs to move.
            token_client.transfer(&contract, &winner, &payout);
            MatchResult {
                match_id: m.id,
                winner: Some(winner),
                payout,
                fee,
                forfeited,
            }
        }
    };
    Ok(result)
}

/// `sha256(move_val as a single byte || salt)`.
fn commitment_hash(env: &Env, move_val: Move, salt: &BytesN<32>) -> BytesN<32> {
    let mut preimage = Bytes::new(env);
    preimage.push_back(move_val as u32 as u8);
    preimage.extend_from_array(&salt.to_array());
    env.crypto().sha256(&preimage).to_bytes()
}
