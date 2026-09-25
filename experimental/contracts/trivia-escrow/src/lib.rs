//! Stellarcade Trivia Escrow Contract (experimental)
//!
//! A timed, commit-reveal trivia wager pool. Players stake a fixed entry fee
//! on a quiz round, commit a hash of their answers before a deadline, reveal
//! their plaintext answers afterward, and the pot is split equally among all
//! players whose revealed answers score a perfect match against the round's
//! answer key hash.
//!
//! ## Storage strategy
//! - `instance()`: `RoundCounter` — a single monotonically increasing id
//!   generator shared across all rounds, one ledger entry.
//! - `persistent()`: `Round`, `Commitment`, `Players` — per-round and
//!   per-player data, each a separate ledger entry with its own TTL, bumped
//!   on every write (see `storage::PERSISTENT_BUMP_LEDGERS`).
//!
//! ## Commit-reveal flow
//! 1. `create_round` — host defines the entry fee, token, answer key hash and
//!    submission deadline. Returns a fresh `round_id`.
//! 2. `submit_commitment` — before `deadline`, a player transfers `entry_fee`
//!    into escrow and stores `SHA-256(serialized_answers || salt)`.
//! 3. `reveal_answers` — after `deadline`, the player supplies their
//!    plaintext answers and salt. The contract recomputes the commitment
//!    hash and rejects any mismatch (wrong salt or tampered answers). On a
//!    match, it separately hashes the answers alone (no salt) and compares
//!    against `answer_key_hash` to determine correctness.
//! 4. `settle_round` — permissionless once `deadline` has passed. Splits
//!    `total_pool` equally among every player who revealed correctly. If
//!    nobody qualifies, all committed players are refunded their stake
//!    (rollover-by-refund; see README "Scoring model").
//!
//! See `types.rs` for storage types and `storage.rs` for storage helpers.
#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractevent, contractimpl, token, Address, Bytes, BytesN, Env, Vec};

pub use types::{Error, PlayerCommitment, TriviaRound, TriviaRoundSummary};

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[contractevent]
pub struct RoundCreated {
    #[topic]
    pub round_id: u64,
    pub host: Address,
    pub entry_fee: i128,
    pub deadline: u64,
}

#[contractevent]
pub struct CommitmentSubmitted {
    #[topic]
    pub round_id: u64,
    #[topic]
    pub player: Address,
}

#[contractevent]
pub struct AnswersRevealed {
    #[topic]
    pub round_id: u64,
    #[topic]
    pub player: Address,
    pub correct: bool,
}

#[contractevent]
pub struct RoundSettled {
    #[topic]
    pub round_id: u64,
    pub winner_count: u32,
    pub payout_per_winner: i128,
    pub rolled_over: bool,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct TriviaEscrow;

#[contractimpl]
impl TriviaEscrow {
    // -----------------------------------------------------------------------
    // create_round
    // -----------------------------------------------------------------------

    /// Create a new trivia round. Any address may host a round.
    ///
    /// `token` is the SEP-41 asset used for stakes and payouts. `entry_fee`
    /// must be strictly positive. `answer_key_hash` is the SHA-256 hash of
    /// the canonical answer-key serialization (see README). `deadline` is a
    /// ledger timestamp (seconds) that must be strictly in the future; no
    /// commitments are accepted once it passes, and reveals only open once
    /// it has.
    pub fn create_round(
        env: Env,
        host: Address,
        token: Address,
        entry_fee: i128,
        answer_key_hash: BytesN<32>,
        deadline: u64,
    ) -> Result<u64, Error> {
        host.require_auth();

        if entry_fee <= 0 {
            return Err(Error::InvalidInput);
        }
        if deadline <= env.ledger().timestamp() {
            return Err(Error::InvalidDeadline);
        }

        let round_id = storage::next_round_id(&env);
        let round = TriviaRound {
            host: host.clone(),
            token,
            entry_fee,
            answer_key_hash,
            deadline,
            total_pool: 0,
            player_count: 0,
            settled: false,
        };
        storage::save_round(&env, round_id, &round);

        RoundCreated {
            round_id,
            host,
            entry_fee,
            deadline,
        }
        .publish(&env);

        Ok(round_id)
    }

    // -----------------------------------------------------------------------
    // submit_commitment
    // -----------------------------------------------------------------------

    /// Lock `entry_fee` in escrow and register `answer_commitment` for
    /// `player` on `round_id`. Must be called before the round's deadline.
    ///
    /// `answer_commitment` should be `SHA-256(serialized_answers || salt)`
    /// as computed off-chain (see README). Each player may only commit once
    /// per round.
    pub fn submit_commitment(
        env: Env,
        player: Address,
        round_id: u64,
        answer_commitment: BytesN<32>,
    ) -> Result<(), Error> {
        player.require_auth();

        let mut round = storage::load_round(&env, round_id)?;
        if round.settled {
            return Err(Error::RoundAlreadySettled);
        }
        if env.ledger().timestamp() >= round.deadline {
            return Err(Error::SubmissionClosed);
        }
        if storage::has_commitment(&env, round_id, &player) {
            return Err(Error::AlreadyCommitted);
        }

        // Pull the stake into escrow before recording state.
        let token_client = token::Client::new(&env, &round.token);
        token_client.transfer(&player, env.current_contract_address(), &round.entry_fee);

        round.total_pool = round
            .total_pool
            .checked_add(round.entry_fee)
            .ok_or(Error::Overflow)?;
        round.player_count = round.player_count.checked_add(1).ok_or(Error::Overflow)?;
        storage::save_round(&env, round_id, &round);

        storage::save_commitment(
            &env,
            round_id,
            &player,
            &PlayerCommitment {
                commitment: answer_commitment,
                revealed: false,
                correct: false,
            },
        );
        storage::add_player(&env, round_id, &player);

        CommitmentSubmitted { round_id, player }.publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // reveal_answers
    // -----------------------------------------------------------------------

    /// Reveal `player`'s plaintext answers and salt for `round_id`.
    ///
    /// Only accepted once the round's deadline has passed. The contract
    /// recomputes `SHA-256(serialized_answers || salt)` and rejects the call
    /// with `RevealMismatch` if it does not equal the stored commitment
    /// (covers both a wrong salt and tampered/incorrect answer encoding).
    /// On a match, correctness is determined by separately hashing the
    /// answers alone and comparing to the round's `answer_key_hash`.
    pub fn reveal_answers(
        env: Env,
        player: Address,
        round_id: u64,
        answers: Vec<u32>,
        salt: BytesN<32>,
    ) -> Result<bool, Error> {
        player.require_auth();

        let round = storage::load_round(&env, round_id)?;
        if round.settled {
            return Err(Error::RoundAlreadySettled);
        }
        if env.ledger().timestamp() < round.deadline {
            return Err(Error::RevealNotOpen);
        }

        let mut commitment = storage::load_commitment(&env, round_id, &player)?;
        if commitment.revealed {
            return Err(Error::AlreadyRevealed);
        }

        let answers_bytes = encode_answers(&env, &answers);

        let mut commit_input = answers_bytes.clone();
        commit_input.append(&Bytes::from_array(&env, &salt.to_array()));
        let recomputed_commitment = env.crypto().sha256(&commit_input);
        if recomputed_commitment.to_bytes() != commitment.commitment {
            return Err(Error::RevealMismatch);
        }

        let answers_hash = env.crypto().sha256(&answers_bytes);
        let correct = answers_hash.to_bytes() == round.answer_key_hash;

        commitment.revealed = true;
        commitment.correct = correct;
        storage::save_commitment(&env, round_id, &player, &commitment);

        AnswersRevealed {
            round_id,
            player,
            correct,
        }
        .publish(&env);

        Ok(correct)
    }

    // -----------------------------------------------------------------------
    // settle_round
    // -----------------------------------------------------------------------

    /// Settle `round_id`, splitting the prize pool equally among every
    /// player who revealed a perfect-score answer set. Permissionless — any
    /// address may trigger settlement once the deadline has passed.
    ///
    /// If no player qualifies (nobody revealed correctly), every committed
    /// player is refunded their entry fee instead (rollover-by-refund; see
    /// README "Scoring model" for rationale). Returns the list of winning
    /// (or refunded, in the rollover case) addresses.
    pub fn settle_round(env: Env, round_id: u64) -> Result<Vec<Address>, Error> {
        let mut round = storage::load_round(&env, round_id)?;
        if round.settled {
            return Err(Error::RoundAlreadySettled);
        }
        if env.ledger().timestamp() < round.deadline {
            return Err(Error::SettlementNotOpen);
        }

        let players = storage::load_players(&env, round_id);
        let mut winners: Vec<Address> = Vec::new(&env);
        for player in players.iter() {
            let commitment = storage::load_commitment(&env, round_id, &player)?;
            if commitment.revealed && commitment.correct {
                winners.push_back(player);
            }
        }

        let token_client = token::Client::new(&env, &round.token);
        round.settled = true;

        if winners.is_empty() {
            // Rollover: nobody qualified, so refund every committed player's
            // stake in full rather than stranding funds in the contract.
            for player in players.iter() {
                token_client.transfer(&env.current_contract_address(), &player, &round.entry_fee);
            }
            storage::save_round(&env, round_id, &round);

            RoundSettled {
                round_id,
                winner_count: 0,
                payout_per_winner: 0,
                rolled_over: true,
            }
            .publish(&env);

            return Ok(players);
        }

        let payout = round.total_pool / (winners.len() as i128);
        for winner in winners.iter() {
            token_client.transfer(&env.current_contract_address(), &winner, &payout);
        }
        storage::save_round(&env, round_id, &round);

        RoundSettled {
            round_id,
            winner_count: winners.len(),
            payout_per_winner: payout,
            rolled_over: false,
        }
        .publish(&env);

        Ok(winners)
    }

    // -----------------------------------------------------------------------
    // get_round_details
    // -----------------------------------------------------------------------

    /// Return a single-call snapshot of `round_id`. `found` is `false` when
    /// the round does not exist; all other fields carry zero/default values
    /// in that case.
    pub fn get_round_details(env: Env, round_id: u64) -> TriviaRoundSummary {
        match storage::load_round(&env, round_id) {
            Ok(round) => TriviaRoundSummary {
                found: true,
                round_id,
                host: round.host,
                token: round.token,
                entry_fee: round.entry_fee,
                answer_key_hash: round.answer_key_hash,
                deadline: round.deadline,
                total_pool: round.total_pool,
                player_count: round.player_count,
                settled: round.settled,
            },
            Err(_) => TriviaRoundSummary {
                found: false,
                round_id,
                host: env.current_contract_address(),
                token: env.current_contract_address(),
                entry_fee: 0,
                answer_key_hash: BytesN::from_array(&env, &[0u8; 32]),
                deadline: 0,
                total_pool: 0,
                player_count: 0,
                settled: false,
            },
        }
    }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Canonical serialization of an answer vector: each answer as a 4-byte
/// big-endian `u32`, concatenated in order. Used both for the salted
/// commitment hash and the salt-free answer-key comparison hash, so both
/// sides of the protocol must agree on answer encoding order.
fn encode_answers(env: &Env, answers: &Vec<u32>) -> Bytes {
    let mut bytes = Bytes::new(env);
    for answer in answers.iter() {
        bytes.append(&Bytes::from_array(env, &answer.to_be_bytes()));
    }
    bytes
}
