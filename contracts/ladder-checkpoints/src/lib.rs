#![no_std]
#![allow(unexpected_cfgs)]

//! Ladder checkpoints (#780): record when a player drifts past a configured
//! ladder checkpoint, and expose two stable read-only views the UI uses to
//! render coaching prompts.
//!
//! - [`Self::checkpoint_drift_summary`] — aggregate active / drifted counts
//!   for a checkpoint, plus the configured thresholds.
//! - [`Self::restore_window_accessor`] — per-player view of where the
//!   player sits relative to the restore deadline.

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    CheckpointConfig, CheckpointDriftSummary, CheckpointState, PlayerRecord, RestoreWindowInfo,
    RestoreWindowState,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Checkpoint(u32),
    Player(Address),
}

#[contract]
pub struct LadderCheckpoints;

#[contractimpl]
impl LadderCheckpoints {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create or update a checkpoint. Population counts are preserved across
    /// updates so the drift summary always reflects the latest recordings.
    pub fn upsert_checkpoint(
        env: Env,
        admin: Address,
        checkpoint_id: u32,
        min_score: u32,
        restore_window_secs: u64,
        paused: bool,
    ) {
        require_admin(&env, &admin);
        assert!(min_score > 0, "min_score must be positive");
        assert!(restore_window_secs > 0, "restore_window must be positive");

        let (active, drifted) = storage::get_checkpoint(&env, checkpoint_id)
            .map(|c| (c.active_player_count, c.drifted_player_count))
            .unwrap_or((0, 0));

        storage::set_checkpoint(
            &env,
            &CheckpointConfig {
                checkpoint_id,
                min_score,
                restore_window_secs,
                active_player_count: active,
                drifted_player_count: drifted,
                paused,
            },
        );
    }

    /// Record / refresh a player's score against a checkpoint.
    ///
    /// Per-checkpoint active/drifted counters are kept consistent across:
    /// new players, score improvements that clear a drift, and drops that
    /// trigger a drift. Players that move between checkpoints are removed
    /// from the previous one before being added to the new.
    pub fn record_score(
        env: Env,
        admin: Address,
        user: Address,
        checkpoint_id: u32,
        score: u32,
        last_seen_at: u64,
    ) {
        require_admin(&env, &admin);
        let mut checkpoint =
            storage::get_checkpoint(&env, checkpoint_id).expect("Checkpoint not found");
        assert!(!checkpoint.paused, "Checkpoint paused");

        let was_active_in_new = score >= checkpoint.min_score;

        let previous = storage::get_player(&env, &user);
        match previous {
            Some(prev) if prev.checkpoint_id == checkpoint_id => {
                // Re-classify in place.
                let was_active_before = prev.last_score >= checkpoint.min_score;
                if was_active_before && !was_active_in_new {
                    checkpoint.active_player_count =
                        checkpoint.active_player_count.checked_sub(1).expect("act underflow");
                    checkpoint.drifted_player_count =
                        checkpoint.drifted_player_count.checked_add(1).expect("drf overflow");
                } else if !was_active_before && was_active_in_new {
                    checkpoint.drifted_player_count =
                        checkpoint.drifted_player_count.checked_sub(1).expect("drf underflow");
                    checkpoint.active_player_count =
                        checkpoint.active_player_count.checked_add(1).expect("act overflow");
                }
            }
            Some(prev) => {
                // Migrated from a different checkpoint: decrement the old
                // checkpoint's matching bucket, then add to the new.
                if let Some(mut old) = storage::get_checkpoint(&env, prev.checkpoint_id) {
                    if prev.last_score >= old.min_score {
                        old.active_player_count =
                            old.active_player_count.checked_sub(1).expect("act underflow");
                    } else {
                        old.drifted_player_count =
                            old.drifted_player_count.checked_sub(1).expect("drf underflow");
                    }
                    storage::set_checkpoint(&env, &old);
                }
                if was_active_in_new {
                    checkpoint.active_player_count =
                        checkpoint.active_player_count.checked_add(1).expect("act overflow");
                } else {
                    checkpoint.drifted_player_count =
                        checkpoint.drifted_player_count.checked_add(1).expect("drf overflow");
                }
            }
            None => {
                if was_active_in_new {
                    checkpoint.active_player_count =
                        checkpoint.active_player_count.checked_add(1).expect("act overflow");
                } else {
                    checkpoint.drifted_player_count =
                        checkpoint.drifted_player_count.checked_add(1).expect("drf overflow");
                }
            }
        }

        storage::set_checkpoint(&env, &checkpoint);
        storage::set_player(
            &env,
            &user,
            &PlayerRecord {
                checkpoint_id,
                last_score: score,
                last_seen_at,
            },
        );
    }

    /// Return a stable drift summary for `checkpoint_id`.
    ///
    /// Pre-`init` returns `configured = false` / `state = NotConfigured`.
    /// Unknown ids after init return `exists = false` / `state = Missing`
    /// with zeroed thresholds.
    pub fn checkpoint_drift_summary(env: Env, checkpoint_id: u32) -> CheckpointDriftSummary {
        let configured = is_configured(&env);
        let Some(checkpoint) = storage::get_checkpoint(&env, checkpoint_id) else {
            return CheckpointDriftSummary {
                checkpoint_id,
                configured,
                exists: false,
                state: if configured {
                    CheckpointState::Missing
                } else {
                    CheckpointState::NotConfigured
                },
                min_score: 0,
                restore_window_secs: 0,
                active_player_count: 0,
                drifted_player_count: 0,
                total_player_count: 0,
            };
        };

        let total = checkpoint
            .active_player_count
            .checked_add(checkpoint.drifted_player_count)
            .unwrap_or(u32::MAX);

        CheckpointDriftSummary {
            checkpoint_id,
            configured,
            exists: true,
            state: if checkpoint.paused {
                CheckpointState::Paused
            } else {
                CheckpointState::Active
            },
            min_score: checkpoint.min_score,
            restore_window_secs: checkpoint.restore_window_secs,
            active_player_count: checkpoint.active_player_count,
            drifted_player_count: checkpoint.drifted_player_count,
            total_player_count: total,
        }
    }

    /// Per-player restore-window accessor.
    ///
    /// Missing players → `NoRecord` + zeroed timing. Missing checkpoints →
    /// `MissingCheckpoint`. A paused checkpoint surfaces as `Blocked` so
    /// frontends suppress restore prompts. Otherwise the state distinguishes
    /// players who are still in good standing (`NotDrifted`) from players
    /// who have drifted but can still restore (`Open`) from those whose
    /// window has lapsed (`Closed`).
    pub fn restore_window_accessor(env: Env, user: Address) -> RestoreWindowInfo {
        let configured = is_configured(&env);
        let now = env.ledger().timestamp();

        let Some(player) = storage::get_player(&env, &user) else {
            return RestoreWindowInfo {
                configured,
                player_found: false,
                checkpoint_found: false,
                checkpoint_id: 0,
                last_score: 0,
                last_seen_at: 0,
                restore_deadline: 0,
                seconds_remaining: 0,
                state: RestoreWindowState::NoRecord,
                checkpoint_paused: false,
            };
        };

        let Some(checkpoint) = storage::get_checkpoint(&env, player.checkpoint_id) else {
            return RestoreWindowInfo {
                configured,
                player_found: true,
                checkpoint_found: false,
                checkpoint_id: player.checkpoint_id,
                last_score: player.last_score,
                last_seen_at: player.last_seen_at,
                restore_deadline: 0,
                seconds_remaining: 0,
                state: RestoreWindowState::MissingCheckpoint,
                checkpoint_paused: false,
            };
        };

        let restore_deadline = player
            .last_seen_at
            .saturating_add(checkpoint.restore_window_secs);
        let seconds_remaining = restore_deadline.saturating_sub(now);

        let state = if checkpoint.paused {
            RestoreWindowState::Blocked
        } else if player.last_score >= checkpoint.min_score {
            RestoreWindowState::NotDrifted
        } else if now >= restore_deadline {
            RestoreWindowState::Closed
        } else {
            RestoreWindowState::Open
        };

        RestoreWindowInfo {
            configured,
            player_found: true,
            checkpoint_found: true,
            checkpoint_id: player.checkpoint_id,
            last_score: player.last_score,
            last_seen_at: player.last_seen_at,
            restore_deadline,
            seconds_remaining,
            state,
            checkpoint_paused: checkpoint.paused,
        }
    }
}

fn is_configured(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

fn require_admin(env: &Env, admin: &Address) {
    admin.require_auth();
    let stored: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    assert!(stored == *admin, "Unauthorized");
}

#[cfg(test)]
mod test;
