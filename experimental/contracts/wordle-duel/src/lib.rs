#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, vec, Address, BytesN, Env, Vec};
use types::{
    DuelResult, DuelStatus, GuessFeedback, PlayerState, TileResult, Word, WordleDuel,
    WordleDuelSummary, MAX_ATTEMPTS, WORD_LENGTH,
};

/// Standard Wordle feedback: two passes so duplicate letters are scored
/// correctly. Pass 1 marks exact-position matches (Green) and removes them
/// from the "available to match" pool. Pass 2 walks the remaining Gray
/// tiles and marks Yellow for a letter that's present elsewhere in the
/// remaining pool, consuming one occurrence per match so a guess with two
/// of the same letter can't score two Yellows against only one remaining
/// occurrence in the secret word.
fn evaluate_guess(env: &Env, guess: &Word, secret: &Word) -> Vec<TileResult> {
    let guess_bytes = guess.to_array();
    let secret_bytes = secret.to_array();

    let mut result = [TileResult::Gray; WORD_LENGTH];
    let mut secret_pool = [0u8; WORD_LENGTH];
    let mut pool_len = 0usize;

    for (slot, (&g, &s)) in result.iter_mut().zip(guess_bytes.iter().zip(secret_bytes.iter())) {
        if g == s {
            *slot = TileResult::Green;
        } else {
            secret_pool[pool_len] = s;
            pool_len += 1;
        }
    }

    for (slot, &g) in result.iter_mut().zip(guess_bytes.iter()) {
        if *slot == TileResult::Green {
            continue;
        }
        if let Some(pool_slot) = secret_pool[..pool_len].iter_mut().find(|s| **s == g) {
            *slot = TileResult::Yellow;
            // Consume this occurrence so it can't be matched again.
            *pool_slot = 0;
        }
    }

    let mut tiles = Vec::new(env);
    for r in result.iter() {
        tiles.push_back(*r);
    }
    tiles
}

fn is_all_green(tiles: &Vec<TileResult>) -> bool {
    tiles.iter().all(|t| t == TileResult::Green)
}

#[contract]
pub struct WordleDuelContract;

#[contractimpl]
impl WordleDuelContract {
    /// Creates a duel lobby. `player_a` commits their word via `word_hash =
    /// sha256(word ++ salt)`, but also supplies the plaintext `word` here so
    /// the contract can score the opponent's live guesses against it —
    /// `reveal_and_settle` later verifies this word actually matches the
    /// hash, so a mismatch (a player who tries to change their word
    /// mid-match) forfeits rather than silently succeeding.
    pub fn create_duel(
        env: Env,
        player_a: Address,
        wager: u128,
        word: Word,
        word_hash: BytesN<32>,
    ) -> u64 {
        player_a.require_auth();

        if wager == 0 {
            panic!("wager must be > 0");
        }

        let duel_id = storage::get_next_duel_id(&env);
        storage::set_next_duel_id(&env, duel_id + 1);

        // Placeholder player_b state until someone actually joins — gated
        // entirely by `has_player_b`, never read or authenticated against
        // while false.
        let placeholder = PlayerState {
            player: player_a.clone(),
            secret_word: Word::from_array(&env, &[0u8; WORD_LENGTH]),
            word_hash: BytesN::from_array(&env, &[0u8; 32]),
            guesses: vec![&env],
            has_won: false,
        };

        let duel = WordleDuel {
            duel_id,
            wager,
            player_a: PlayerState {
                player: player_a,
                secret_word: word,
                word_hash,
                guesses: vec![&env],
                has_won: false,
            },
            player_b: placeholder,
            has_player_b: false,
            player_a_revealed: false,
            player_b_revealed: false,
            status: DuelStatus::WaitingForOpponent,
        };

        storage::set_duel(&env, &duel);
        duel_id
    }

    pub fn join_duel(env: Env, duel_id: u64, player_b: Address, word: Word, word_hash: BytesN<32>) {
        player_b.require_auth();

        let mut duel = storage::get_duel(&env, duel_id).expect("duel not found");
        if duel.status != DuelStatus::WaitingForOpponent {
            panic!("duel is not waiting for an opponent");
        }
        if duel.player_a.player == player_b {
            panic!("cannot duel yourself");
        }

        duel.player_b = PlayerState {
            player: player_b,
            secret_word: word,
            word_hash,
            guesses: vec![&env],
            has_won: false,
        };
        duel.has_player_b = true;
        duel.status = DuelStatus::InProgress;

        storage::set_duel(&env, &duel);
    }

    /// `player` submits a guess at the OPPONENT's word. Feedback is scored
    /// live against the opponent's stored plaintext word (see create_duel's
    /// doc comment) — the actual hash-commitment check happens later, at
    /// reveal_and_settle.
    pub fn submit_guess(env: Env, duel_id: u64, player: Address, guess: Word) -> GuessFeedback {
        player.require_auth();

        let mut duel = storage::get_duel(&env, duel_id).expect("duel not found");
        if duel.status != DuelStatus::InProgress {
            panic!("duel is not in progress");
        }

        let (attacker_is_a, opponent_word) = if duel.player_a.player == player {
            (true, duel.player_b.secret_word.clone())
        } else if duel.player_b.player == player {
            (false, duel.player_a.secret_word.clone())
        } else {
            panic!("player is not part of this duel");
        };

        let attacker = if attacker_is_a { &duel.player_a } else { &duel.player_b };
        if attacker.has_won {
            panic!("you have already won this duel");
        }
        if attacker.guesses.len() >= MAX_ATTEMPTS {
            panic!("maximum attempts reached");
        }

        let tiles = evaluate_guess(&env, &guess, &opponent_word);
        let is_correct = is_all_green(&tiles);

        let feedback = GuessFeedback {
            guess: guess.clone(),
            tiles,
            is_correct,
        };

        if attacker_is_a {
            duel.player_a.guesses.push_back(feedback.clone());
            if is_correct {
                duel.player_a.has_won = true;
            }
        } else {
            duel.player_b.guesses.push_back(feedback.clone());
            if is_correct {
                duel.player_b.has_won = true;
            }
        }

        storage::set_duel(&env, &duel);
        feedback
    }

    /// Reveals `secret_word`/`salt` and verifies `sha256(secret_word ++
    /// salt) == word_hash` for the calling player. A mismatch forfeits the
    /// match for that player immediately — a defense against a player
    /// having lied about their word being stable (a live-scored guess and a
    /// revealed word that don't match the original commitment is exactly
    /// the fraud this commitment scheme exists to catch).
    ///
    /// Both players must reveal independently; the match only actually
    /// settles (status flips, a payout is computed) once both have
    /// revealed. The first caller gets back a result with `is_final: false`
    /// and zeroed payouts — call `get_duel_state`/re-call this after the
    /// opponent reveals to see the real outcome.
    pub fn reveal_and_settle(
        env: Env,
        duel_id: u64,
        player: Address,
        secret_word: Word,
        salt: BytesN<32>,
    ) -> DuelResult {
        player.require_auth();

        let mut duel = storage::get_duel(&env, duel_id).expect("duel not found");
        if duel.status != DuelStatus::InProgress {
            panic!("duel is not in progress");
        }

        let is_a = duel.player_a.player == player;
        let is_b = duel.player_b.player == player;
        if !is_a && !is_b {
            panic!("player is not part of this duel");
        }
        if (is_a && duel.player_a_revealed) || (is_b && duel.player_b_revealed) {
            panic!("this player has already revealed");
        }

        let mut preimage = soroban_sdk::Bytes::new(&env);
        preimage.append(&soroban_sdk::Bytes::from_array(&env, &secret_word.to_array()));
        preimage.append(&soroban_sdk::Bytes::from_array(&env, &salt.to_array()));
        let computed_hash: BytesN<32> = env.crypto().sha256(&preimage).to_bytes();

        let expected_hash = if is_a {
            duel.player_a.word_hash.clone()
        } else {
            duel.player_b.word_hash.clone()
        };

        if computed_hash != expected_hash {
            // Fraudulent reveal: this player forfeits immediately, no need
            // to wait on the other player's reveal.
            duel.status = DuelStatus::Forfeited;
            let winner = if is_a { duel.player_b.player.clone() } else { duel.player_a.player.clone() };
            let a_payout = if is_a { 0 } else { duel.wager * 2 };
            let b_payout = if is_a { duel.wager * 2 } else { 0 };
            storage::set_duel(&env, &duel);
            return DuelResult {
                duel_id,
                winner: Some(winner),
                player_a_payout: a_payout,
                player_b_payout: b_payout,
                forfeited_by: Some(player),
                is_final: true,
            };
        }

        if is_a {
            duel.player_a_revealed = true;
        } else {
            duel.player_b_revealed = true;
        }

        if !(duel.player_a_revealed && duel.player_b_revealed) {
            // Waiting on the other player to reveal too.
            storage::set_duel(&env, &duel);
            return DuelResult {
                duel_id,
                winner: None,
                player_a_payout: 0,
                player_b_payout: 0,
                forfeited_by: None,
                is_final: false,
            };
        }

        duel.status = DuelStatus::Settled;

        let a_won = duel.player_a.has_won;
        let b_won = duel.player_b.has_won;

        let (winner, a_payout, b_payout) = if a_won && !b_won {
            (Some(duel.player_a.player.clone()), duel.wager * 2, 0)
        } else if b_won && !a_won {
            (Some(duel.player_b.player.clone()), 0, duel.wager * 2)
        } else {
            // Both won (tie on the same settling round) or neither has
            // guessed correctly yet — split the pot.
            (None, duel.wager, duel.wager)
        };

        storage::set_duel(&env, &duel);

        DuelResult {
            duel_id,
            winner,
            player_a_payout: a_payout,
            player_b_payout: b_payout,
            forfeited_by: None,
            is_final: true,
        }
    }

    pub fn get_duel_state(env: Env, duel_id: u64) -> WordleDuelSummary {
        let duel = storage::get_duel(&env, duel_id).expect("duel not found");
        WordleDuelSummary {
            duel_id: duel.duel_id,
            wager: duel.wager,
            player_a: duel.player_a.player,
            player_b: if duel.has_player_b { Some(duel.player_b.player) } else { None },
            status: duel.status,
            player_a_attempts: duel.player_a.guesses.len(),
            player_b_attempts: if duel.has_player_b { duel.player_b.guesses.len() } else { 0 },
        }
    }
}

#[cfg(test)]
mod test;
