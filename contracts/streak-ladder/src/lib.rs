#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    BucketConfig, BucketState, DemotionRisk, DemotionRiskLevel, PlayerBucketState,
    PlayerBucketSummary, PlayerRecord, StreakBucketSummary,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Bucket(u32),
    Player(Address),
}

#[contract]
pub struct StreakLadder;

#[contractimpl]
impl StreakLadder {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create or update a streak bucket definition. Existing population counts
    /// are preserved so the summary accessor always reflects the latest
    /// assignment totals without reconstructing them from player scans.
    pub fn upsert_bucket(
        env: Env,
        admin: Address,
        bucket_id: u32,
        min_streak: u32,
        max_streak: u32,
        demotion_window_secs: u64,
        paused: bool,
    ) {
        require_admin(&env, &admin);
        assert!(min_streak > 0, "Minimum streak must be positive");
        assert!(max_streak >= min_streak, "Invalid streak range");
        assert!(demotion_window_secs > 0, "Demotion window must be positive");

        let player_count = storage::get_bucket(&env, bucket_id)
            .map(|bucket| bucket.player_count)
            .unwrap_or(0);

        storage::set_bucket(
            &env,
            &BucketConfig {
                bucket_id,
                min_streak,
                max_streak,
                demotion_window_secs,
                player_count,
                paused,
            },
        );
    }

    /// Assign or refresh a player's streak inside a configured bucket.
    pub fn assign_player(
        env: Env,
        admin: Address,
        user: Address,
        bucket_id: u32,
        current_streak: u32,
        last_extended_at: u64,
    ) {
        require_admin(&env, &admin);
        let mut bucket = storage::get_bucket(&env, bucket_id).expect("Bucket not found");
        assert!(!bucket.paused, "Bucket paused");
        assert!(
            current_streak >= bucket.min_streak && current_streak <= bucket.max_streak,
            "Streak outside bucket range"
        );

        let existing = storage::get_player(&env, &user);
        match existing {
            Some(player) if player.bucket_id == bucket_id => {}
            Some(player) => {
                if let Some(mut old_bucket) = storage::get_bucket(&env, player.bucket_id) {
                    old_bucket.player_count = old_bucket
                        .player_count
                        .checked_sub(1)
                        .expect("Old bucket underflow");
                    storage::set_bucket(&env, &old_bucket);
                }
                bucket.player_count = bucket.player_count.checked_add(1).expect("Bucket overflow");
            }
            None => {
                bucket.player_count = bucket.player_count.checked_add(1).expect("Bucket overflow");
            }
        }

        storage::set_bucket(&env, &bucket);
        storage::set_player(
            &env,
            &user,
            &PlayerRecord {
                bucket_id,
                current_streak,
                last_extended_at,
            },
        );
    }

    /// Return a stable streak-bucket summary for `bucket_id`.
    ///
    /// Before `init` this returns `configured = false` and `state =
    /// NotConfigured`. Unknown bucket ids after initialization return `exists =
    /// false`, `state = Missing`, and zeroed thresholds.
    pub fn streak_bucket_summary(env: Env, bucket_id: u32) -> StreakBucketSummary {
        let configured = is_configured(&env);

        let Some(bucket) = storage::get_bucket(&env, bucket_id) else {
            return StreakBucketSummary {
                bucket_id,
                configured,
                exists: false,
                state: if configured {
                    BucketState::Missing
                } else {
                    BucketState::NotConfigured
                },
                min_streak: 0,
                max_streak: 0,
                demotion_window_secs: 0,
                player_count: 0,
            };
        };

        StreakBucketSummary {
            bucket_id,
            configured,
            exists: true,
            state: if bucket.paused {
                BucketState::Paused
            } else {
                BucketState::Active
            },
            min_streak: bucket.min_streak,
            max_streak: bucket.max_streak,
            demotion_window_secs: bucket.demotion_window_secs,
            player_count: bucket.player_count,
        }
    }

    /// Return a compact demotion-risk view for a player.
    ///
    /// Missing players return `player_found = false` and zeroed timing fields.
    /// Missing buckets return `bucket_found = false` without panicking. The risk
    /// window is computed from the current ledger timestamp; all timing values
    /// are exact seconds.
    pub fn demotion_risk(env: Env, user: Address) -> DemotionRisk {
        let configured = is_configured(&env);
        let now = env.ledger().timestamp();

        let Some(player) = storage::get_player(&env, &user) else {
            return DemotionRisk {
                configured,
                player_found: false,
                bucket_found: false,
                bucket_id: 0,
                current_streak: 0,
                last_extended_at: 0,
                demotion_at: 0,
                seconds_until_demotion: 0,
                risk_level: DemotionRiskLevel::None,
                bucket_paused: false,
                would_demote_now: false,
            };
        };

        let Some(bucket) = storage::get_bucket(&env, player.bucket_id) else {
            return DemotionRisk {
                configured,
                player_found: true,
                bucket_found: false,
                bucket_id: player.bucket_id,
                current_streak: player.current_streak,
                last_extended_at: player.last_extended_at,
                demotion_at: 0,
                seconds_until_demotion: 0,
                risk_level: DemotionRiskLevel::None,
                bucket_paused: false,
                would_demote_now: false,
            };
        };

        let demotion_at = player
            .last_extended_at
            .saturating_add(bucket.demotion_window_secs);
        let seconds_until_demotion = demotion_at.saturating_sub(now);
        let would_demote_now = player.current_streak < bucket.min_streak || now >= demotion_at;

        let risk_level = if bucket.paused {
            DemotionRiskLevel::Blocked
        } else if would_demote_now {
            DemotionRiskLevel::Critical
        } else {
            let remaining_pct = (seconds_until_demotion * 100) / bucket.demotion_window_secs;
            match remaining_pct {
                0..=10 => DemotionRiskLevel::High,
                11..=25 => DemotionRiskLevel::Medium,
                26..=50 => DemotionRiskLevel::Low,
                _ => DemotionRiskLevel::None,
            }
        };

        DemotionRisk {
            configured,
            player_found: true,
            bucket_found: true,
            bucket_id: player.bucket_id,
            current_streak: player.current_streak,
            last_extended_at: player.last_extended_at,
            demotion_at,
            seconds_until_demotion,
            risk_level,
            bucket_paused: bucket.paused,
            would_demote_now,
        }
    }

    /// Return a joined player+bucket snapshot for UI/API consumers.
    ///
    /// This read is side-effect free and returns predictable fallback values:
    /// - before `init`: `configured = false`, `state = NotConfigured`
    /// - unknown player: `player_found = false`, `state = MissingPlayer`
    /// - dangling bucket reference: `bucket_found = false`, `state = MissingBucket`
    /// - paused bucket: `state = Paused`
    pub fn player_bucket_summary(env: Env, user: Address) -> PlayerBucketSummary {
        let configured = is_configured(&env);
        let Some(player) = storage::get_player(&env, &user) else {
            return PlayerBucketSummary {
                configured,
                player_found: false,
                bucket_found: false,
                state: if configured {
                    PlayerBucketState::MissingPlayer
                } else {
                    PlayerBucketState::NotConfigured
                },
                bucket_id: 0,
                current_streak: 0,
                last_extended_at: 0,
                min_streak: 0,
                max_streak: 0,
                demotion_window_secs: 0,
                bucket_player_count: 0,
            };
        };

        let Some(bucket) = storage::get_bucket(&env, player.bucket_id) else {
            return PlayerBucketSummary {
                configured,
                player_found: true,
                bucket_found: false,
                state: PlayerBucketState::MissingBucket,
                bucket_id: player.bucket_id,
                current_streak: player.current_streak,
                last_extended_at: player.last_extended_at,
                min_streak: 0,
                max_streak: 0,
                demotion_window_secs: 0,
                bucket_player_count: 0,
            };
        };

        PlayerBucketSummary {
            configured,
            player_found: true,
            bucket_found: true,
            state: if bucket.paused {
                PlayerBucketState::Paused
            } else {
                PlayerBucketState::Active
            },
            bucket_id: bucket.bucket_id,
            current_streak: player.current_streak,
            last_extended_at: player.last_extended_at,
            min_streak: bucket.min_streak,
            max_streak: bucket.max_streak,
            demotion_window_secs: bucket.demotion_window_secs,
            bucket_player_count: bucket.player_count,
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
