//! Stellarcade Trivia Duel Contract (experimental)
//!
//! Two-player trivia duel with commitment-based answer submission:
//! players escrow matched wagers, commit `sha256(answer_be_bytes || salt)`
//! hashes per round (so neither side can copy the other's answer), then
//! reveal. A trusted admin records the correct answer per round; settlement
//! scores both players and pays the escrowed pot to the winner.
//!
//! ## Scoring
//! A correct revealed answer earns [`BASE_POINTS`] plus a speed bonus of one
//! point per second between the commitment and the duel's commit deadline —
//! i.e. points scale inversely with the commit timestamp. Wrong, unrevealed,
//! or uncommitted rounds score zero.
//!
//! ## Settlement
//! The winner receives the full pot minus the protocol fee (`fee_bps`).
//! On an exact points tie both wagers are refunded and no fee is taken.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, Bytes, BytesN, Env};

pub use types::{AnswerCommit, CommitSlot, Duel, DuelSettlement, DuelStatus, RoundView};

/// Points for a correct answer before the speed bonus.
pub const BASE_POINTS: u64 = 1_000;
/// Commit window granted per question, in seconds.
pub const SECONDS_PER_QUESTION: u64 = 60;
/// Upper bound on questions per duel.
pub const MAX_QUESTIONS: u32 = 25;
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
    InvalidQuestionCount = 5,
    DuelNotFound = 6,
    NotJoinable = 7,
    CannotDuelSelf = 8,
    NotDuelPlayer = 9,
    DuelNotInProgress = 10,
    InvalidRound = 11,
    AlreadyCommitted = 12,
    CommitPhaseClosed = 13,
    NothingToReveal = 14,
    AlreadyRevealed = 15,
    RevealTooEarly = 16,
    InvalidReveal = 17,
    AnswerKeyIncomplete = 18,
    SettleTooEarly = 19,
    SettlementNotFound = 20,
}

#[contract]
pub struct TriviaDuel;

#[contractimpl]
impl TriviaDuel {
    /// One-time setup: the trusted answer-key admin, the wager token, and
    /// the protocol fee in basis points (max [`MAX_FEE_BPS`]).
    pub fn initialize(env: Env, admin: Address, token: Address, fee_bps: u32) -> Result<(), Error> {
        if storage::read_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        if fee_bps > MAX_FEE_BPS {
            return Err(Error::FeeTooHigh);
        }
        storage::write_admin(&env, &admin);
        storage::write_token(&env, &token);
        storage::write_fee_bps(&env, fee_bps);
        Ok(())
    }

    /// Open a duel: the host escrows `wager` and waits for a challenger.
    pub fn create_duel(
        env: Env,
        host: Address,
        wager: i128,
        question_count: u32,
    ) -> Result<u64, Error> {
        host.require_auth();
        if storage::read_admin(&env).is_none() {
            return Err(Error::NotInitialized);
        }
        if wager <= 0 {
            return Err(Error::InvalidWager);
        }
        if question_count == 0 || question_count > MAX_QUESTIONS {
            return Err(Error::InvalidQuestionCount);
        }

        token::Client::new(&env, &storage::read_token(&env)).transfer(
            &host,
            env.current_contract_address(),
            &wager,
        );

        let id = storage::next_duel_id(&env);
        storage::write_duel(
            &env,
            &Duel {
                id,
                host,
                challenger: None,
                wager,
                question_count,
                status: DuelStatus::AwaitingChallenger,
                started_at: 0,
                commit_deadline: 0,
            },
        );
        Ok(id)
    }

    /// Join an open duel with a matched wager; opens the commit window.
    pub fn join_duel(env: Env, duel_id: u64, challenger: Address) -> Result<(), Error> {
        challenger.require_auth();
        let mut duel = storage::read_duel(&env, duel_id).ok_or(Error::DuelNotFound)?;
        if duel.status != DuelStatus::AwaitingChallenger {
            return Err(Error::NotJoinable);
        }
        if challenger == duel.host {
            return Err(Error::CannotDuelSelf);
        }

        token::Client::new(&env, &storage::read_token(&env)).transfer(
            &challenger,
            env.current_contract_address(),
            &duel.wager,
        );

        let now = env.ledger().timestamp();
        duel.challenger = Some(challenger);
        duel.status = DuelStatus::InProgress;
        duel.started_at = now;
        duel.commit_deadline = now + duel.question_count as u64 * SECONDS_PER_QUESTION;
        storage::write_duel(&env, &duel);
        Ok(())
    }

    /// Commit `sha256(answer_val_be_bytes || salt)` for one round.
    ///
    /// Commitments are immutable and only accepted before the commit
    /// deadline, so neither player can react to the opponent's choice.
    pub fn submit_answer_commit(
        env: Env,
        duel_id: u64,
        player: Address,
        round_idx: u32,
        answer_hash: BytesN<32>,
    ) -> Result<(), Error> {
        player.require_auth();
        let duel = storage::read_duel(&env, duel_id).ok_or(Error::DuelNotFound)?;
        require_duel_player(&duel, &player)?;
        if duel.status != DuelStatus::InProgress {
            return Err(Error::DuelNotInProgress);
        }
        if round_idx >= duel.question_count {
            return Err(Error::InvalidRound);
        }
        let now = env.ledger().timestamp();
        if now > duel.commit_deadline {
            return Err(Error::CommitPhaseClosed);
        }
        if storage::read_commit(&env, duel_id, round_idx, &player).is_some() {
            return Err(Error::AlreadyCommitted);
        }

        storage::write_commit(
            &env,
            duel_id,
            round_idx,
            &player,
            &AnswerCommit {
                answer_hash,
                committed_at: now,
                revealed: false,
                answer_val: 0,
            },
        );
        Ok(())
    }

    /// Reveal a committed answer by supplying the value and salt.
    ///
    /// Reveals open only once both players have committed the round (or the
    /// commit deadline has passed), so a reveal can never leak an answer the
    /// opponent could still commit against.
    pub fn reveal_answer(
        env: Env,
        duel_id: u64,
        player: Address,
        round_idx: u32,
        answer_val: u32,
        salt: BytesN<32>,
    ) -> Result<(), Error> {
        player.require_auth();
        let duel = storage::read_duel(&env, duel_id).ok_or(Error::DuelNotFound)?;
        require_duel_player(&duel, &player)?;
        if duel.status != DuelStatus::InProgress {
            return Err(Error::DuelNotInProgress);
        }
        if round_idx >= duel.question_count {
            return Err(Error::InvalidRound);
        }

        let mut commit = storage::read_commit(&env, duel_id, round_idx, &player)
            .ok_or(Error::NothingToReveal)?;
        if commit.revealed {
            return Err(Error::AlreadyRevealed);
        }

        let opponent = opponent_of(&duel, &player);
        let opponent_committed =
            storage::read_commit(&env, duel_id, round_idx, &opponent).is_some();
        if !opponent_committed && env.ledger().timestamp() <= duel.commit_deadline {
            return Err(Error::RevealTooEarly);
        }

        if commitment_hash(&env, answer_val, &salt) != commit.answer_hash {
            return Err(Error::InvalidReveal);
        }

        commit.revealed = true;
        commit.answer_val = answer_val;
        storage::write_commit(&env, duel_id, round_idx, &player, &commit);
        Ok(())
    }

    /// Admin publishes the correct answer for one round.
    pub fn record_correct_answer(
        env: Env,
        duel_id: u64,
        round_idx: u32,
        correct_val: u32,
    ) -> Result<(), Error> {
        let admin = storage::read_admin(&env).ok_or(Error::NotInitialized)?;
        admin.require_auth();
        let duel = storage::read_duel(&env, duel_id).ok_or(Error::DuelNotFound)?;
        if round_idx >= duel.question_count {
            return Err(Error::InvalidRound);
        }
        storage::write_correct_answer(&env, duel_id, round_idx, correct_val);
        Ok(())
    }

    /// Score both players and disburse the escrowed pot.
    ///
    /// Callable by anyone once the commit window has closed (or every round
    /// is fully revealed) and the admin has recorded every correct answer.
    pub fn settle_duel(env: Env, duel_id: u64) -> Result<DuelSettlement, Error> {
        let mut duel = storage::read_duel(&env, duel_id).ok_or(Error::DuelNotFound)?;
        if duel.status != DuelStatus::InProgress {
            return Err(Error::DuelNotInProgress);
        }
        let challenger = duel.challenger.clone().ok_or(Error::DuelNotInProgress)?;

        let now = env.ledger().timestamp();
        if now <= duel.commit_deadline && !all_rounds_revealed(&env, &duel, &challenger) {
            return Err(Error::SettleTooEarly);
        }
        for round_idx in 0..duel.question_count {
            if storage::read_correct_answer(&env, duel_id, round_idx).is_none() {
                return Err(Error::AnswerKeyIncomplete);
            }
        }

        let host_points = score_player(&env, &duel, &duel.host);
        let challenger_points = score_player(&env, &duel, &challenger);

        let token = token::Client::new(&env, &storage::read_token(&env));
        let contract = env.current_contract_address();
        let pot = duel.wager * 2;

        let settlement = if host_points == challenger_points {
            // Exact tie: refund both wagers, no fee.
            token.transfer(&contract, &duel.host, &duel.wager);
            token.transfer(&contract, &challenger, &duel.wager);
            DuelSettlement {
                duel_id,
                host_points,
                challenger_points,
                winner: None,
                payout: 0,
                fee: 0,
            }
        } else {
            let winner = if host_points > challenger_points {
                duel.host.clone()
            } else {
                challenger.clone()
            };
            let fee = pot * storage::read_fee_bps(&env) as i128 / 10_000;
            let payout = pot - fee;
            if fee > 0 {
                let admin = storage::read_admin(&env).ok_or(Error::NotInitialized)?;
                token.transfer(&contract, &admin, &fee);
            }
            token.transfer(&contract, &winner, &payout);
            DuelSettlement {
                duel_id,
                host_points,
                challenger_points,
                winner: Some(winner),
                payout,
                fee,
            }
        };

        duel.status = DuelStatus::Settled;
        storage::write_duel(&env, &duel);
        storage::write_settlement(&env, &settlement);
        Ok(settlement)
    }

    /// Full duel state.
    pub fn get_duel(env: Env, duel_id: u64) -> Result<Duel, Error> {
        storage::read_duel(&env, duel_id).ok_or(Error::DuelNotFound)
    }

    /// Commitment-verification accessor: both commits and the recorded
    /// correct answer for one round.
    pub fn get_round_state(env: Env, duel_id: u64, round_idx: u32) -> Result<RoundView, Error> {
        let duel = storage::read_duel(&env, duel_id).ok_or(Error::DuelNotFound)?;
        if round_idx >= duel.question_count {
            return Err(Error::InvalidRound);
        }
        let to_slot = |commit: Option<AnswerCommit>| match commit {
            Some(c) => CommitSlot::Committed(c),
            None => CommitSlot::Empty,
        };
        let challenger_commit = duel
            .challenger
            .as_ref()
            .and_then(|c| storage::read_commit(&env, duel_id, round_idx, c));
        Ok(RoundView {
            round_idx,
            host_commit: to_slot(storage::read_commit(&env, duel_id, round_idx, &duel.host)),
            challenger_commit: to_slot(challenger_commit),
            correct_val: storage::read_correct_answer(&env, duel_id, round_idx),
        })
    }

    /// Scoring accessor: live points for (host, challenger) from the rounds
    /// revealed and recorded so far.
    pub fn get_scores(env: Env, duel_id: u64) -> Result<(u64, u64), Error> {
        let duel = storage::read_duel(&env, duel_id).ok_or(Error::DuelNotFound)?;
        let challenger_points = duel
            .challenger
            .as_ref()
            .map(|c| score_player(&env, &duel, c))
            .unwrap_or(0);
        Ok((score_player(&env, &duel, &duel.host), challenger_points))
    }

    /// Settlement record for a settled duel.
    pub fn get_settlement(env: Env, duel_id: u64) -> Result<DuelSettlement, Error> {
        storage::read_settlement(&env, duel_id).ok_or(Error::SettlementNotFound)
    }
}

fn require_duel_player(duel: &Duel, player: &Address) -> Result<(), Error> {
    if *player == duel.host || duel.challenger.as_ref() == Some(player) {
        Ok(())
    } else {
        Err(Error::NotDuelPlayer)
    }
}

fn opponent_of(duel: &Duel, player: &Address) -> Address {
    if *player == duel.host {
        // Callers ensure the duel is in progress, so a challenger exists.
        duel.challenger.clone().unwrap()
    } else {
        duel.host.clone()
    }
}

/// `sha256(answer_val as 4 big-endian bytes || salt)`.
fn commitment_hash(env: &Env, answer_val: u32, salt: &BytesN<32>) -> BytesN<32> {
    let mut preimage = Bytes::new(env);
    preimage.extend_from_array(&answer_val.to_be_bytes());
    preimage.extend_from_array(&salt.to_array());
    env.crypto().sha256(&preimage).to_bytes()
}

fn all_rounds_revealed(env: &Env, duel: &Duel, challenger: &Address) -> bool {
    for round_idx in 0..duel.question_count {
        for player in [&duel.host, challenger] {
            match storage::read_commit(env, duel.id, round_idx, player) {
                Some(c) if c.revealed => {}
                _ => return false,
            }
        }
    }
    true
}

/// Sum a player's points over every round with a recorded correct answer.
fn score_player(env: &Env, duel: &Duel, player: &Address) -> u64 {
    let mut points: u64 = 0;
    for round_idx in 0..duel.question_count {
        let correct = match storage::read_correct_answer(env, duel.id, round_idx) {
            Some(v) => v,
            None => continue,
        };
        if let Some(commit) = storage::read_commit(env, duel.id, round_idx, player) {
            if commit.revealed && commit.answer_val == correct {
                // Earlier commits earn a larger bonus (inverse to timestamp).
                points += BASE_POINTS + (duel.commit_deadline - commit.committed_at);
            }
        }
    }
    points
}
