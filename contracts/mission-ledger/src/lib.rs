#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{ClaimReadiness, ClaimReadinessReason, MissionRecord, MissionSnapshot, MissionStatus};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Mission(u64),
    PlayerProgress(u64, Address),
    PlayerClaimed(u64, Address),
}

#[contract]
pub struct MissionLedger;

#[contractimpl]
impl MissionLedger {
    /// Initialise the ledger with an admin who can register / pause missions.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Register a new mission. Idempotent only on duplicate `mission_id` —
    /// re-registration with a different id is allowed.
    pub fn register_mission(
        env: Env,
        admin: Address,
        mission_id: u64,
        operator: Address,
        completion_threshold: u32,
        reward_amount: i128,
        reward_token: Address,
        expires_at: u64,
    ) {
        require_admin(&env, &admin);
        admin.require_auth();
        assert!(
            completion_threshold > 0,
            "completion_threshold must be positive"
        );
        assert!(reward_amount >= 0, "reward_amount must be non-negative");
        assert!(
            expires_at > env.ledger().timestamp(),
            "expires_at must be in the future"
        );
        if storage::get_mission(&env, mission_id).is_some() {
            panic!("Mission already registered");
        }

        storage::set_mission(
            &env,
            &MissionRecord {
                mission_id,
                operator,
                completion_threshold,
                reward_amount,
                reward_token,
                expires_at,
                paused: false,
                completed_count: 0,
                total_claimed: 0,
            },
        );
    }

    /// Record incremental progress for `player` against `mission_id`.
    ///
    /// `progress_delta` is added to the player's running counter; the contract
    /// caps the stored value at `completion_threshold` so external counters
    /// can over-report without breaking readiness semantics.
    pub fn record_progress(env: Env, player: Address, mission_id: u64, progress_delta: u32) {
        player.require_auth();
        let mission = storage::get_mission(&env, mission_id).expect("Mission not registered");
        assert!(!mission.paused, "Mission is paused");
        assert!(
            env.ledger().timestamp() < mission.expires_at,
            "Mission expired"
        );

        let current = storage::get_player_progress(&env, mission_id, &player).unwrap_or(0);
        let next = current
            .saturating_add(progress_delta)
            .min(mission.completion_threshold);
        storage::set_player_progress(&env, mission_id, &player, next);
    }

    /// Mark a mission paused / unpaused. Pausing leaves the record in place
    /// but blocks `record_progress` and `claim`.
    pub fn set_paused(env: Env, admin: Address, mission_id: u64, paused: bool) {
        require_admin(&env, &admin);
        admin.require_auth();
        let mut mission = storage::get_mission(&env, mission_id).expect("Mission not registered");
        mission.paused = paused;
        storage::set_mission(&env, &mission);
    }

    /// Claim the reward for a completed mission. Idempotent on
    /// `(mission_id, player)`.
    pub fn claim(env: Env, player: Address, mission_id: u64) -> i128 {
        player.require_auth();
        let readiness = Self::reward_claim_ready(env.clone(), mission_id, player.clone());
        assert!(readiness.ready, "Reward not claimable");

        let mut mission = storage::get_mission(&env, mission_id).expect("Mission not registered");
        storage::mark_player_claimed(&env, mission_id, &player);
        mission.completed_count = mission.completed_count.saturating_add(1);
        mission.total_claimed = mission.total_claimed.saturating_add(mission.reward_amount);
        storage::set_mission(&env, &mission);

        mission.reward_amount
    }

    // ---------------------------------------------------------------------
    // Read-only accessors (the body of issue #679)
    // ---------------------------------------------------------------------

    /// Snapshot of the on-chain mission state. Suitable for direct rendering
    /// on the frontend dashboard without ad-hoc joins.
    pub fn mission_snapshot(env: Env, mission_id: u64) -> MissionSnapshot {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(mission) = storage::get_mission(&env, mission_id) else {
            return MissionSnapshot {
                mission_id,
                configured,
                exists: false,
                status: if configured {
                    MissionStatus::NotConfigured
                } else {
                    MissionStatus::NotConfigured
                },
                completion_threshold: 0,
                completed_count: 0,
                reward_amount: 0,
                total_claimed: 0,
                expires_at: 0,
                now,
            };
        };

        let status = derive_status(&mission, now);

        MissionSnapshot {
            mission_id,
            configured,
            exists: true,
            status,
            completion_threshold: mission.completion_threshold,
            completed_count: mission.completed_count,
            reward_amount: mission.reward_amount,
            total_claimed: mission.total_claimed,
            expires_at: mission.expires_at,
            now,
        }
    }

    /// Whether `player` can claim the reward for `mission_id`. Returns a
    /// structured reason regardless of the boolean outcome so observability
    /// tooling can log the exact gating condition.
    pub fn reward_claim_ready(env: Env, mission_id: u64, player: Address) -> ClaimReadiness {
        let configured = env.storage().instance().has(&DataKey::Admin);
        if !configured {
            return ClaimReadiness {
                mission_id,
                ready: false,
                reason: ClaimReadinessReason::LedgerNotConfigured,
                progress: 0,
                threshold: 0,
            };
        }

        let Some(mission) = storage::get_mission(&env, mission_id) else {
            return ClaimReadiness {
                mission_id,
                ready: false,
                reason: ClaimReadinessReason::MissionUnknown,
                progress: 0,
                threshold: 0,
            };
        };

        if storage::has_player_claimed(&env, mission_id, &player) {
            return ClaimReadiness {
                mission_id,
                ready: false,
                reason: ClaimReadinessReason::AlreadyClaimed,
                progress: mission.completion_threshold,
                threshold: mission.completion_threshold,
            };
        }
        if mission.paused {
            return ClaimReadiness {
                mission_id,
                ready: false,
                reason: ClaimReadinessReason::MissionPaused,
                progress: storage::get_player_progress(&env, mission_id, &player).unwrap_or(0),
                threshold: mission.completion_threshold,
            };
        }
        if env.ledger().timestamp() >= mission.expires_at {
            return ClaimReadiness {
                mission_id,
                ready: false,
                reason: ClaimReadinessReason::MissionExpired,
                progress: storage::get_player_progress(&env, mission_id, &player).unwrap_or(0),
                threshold: mission.completion_threshold,
            };
        }

        let Some(progress) = storage::get_player_progress(&env, mission_id, &player) else {
            return ClaimReadiness {
                mission_id,
                ready: false,
                reason: ClaimReadinessReason::PlayerNotEnrolled,
                progress: 0,
                threshold: mission.completion_threshold,
            };
        };

        if progress < mission.completion_threshold {
            return ClaimReadiness {
                mission_id,
                ready: false,
                reason: ClaimReadinessReason::ProgressIncomplete,
                progress,
                threshold: mission.completion_threshold,
            };
        }

        ClaimReadiness {
            mission_id,
            ready: true,
            reason: ClaimReadinessReason::Ready,
            progress,
            threshold: mission.completion_threshold,
        }
    }
}

fn derive_status(mission: &MissionRecord, now: u64) -> MissionStatus {
    if mission.paused {
        return MissionStatus::Paused;
    }
    if now >= mission.expires_at {
        if mission.completed_count > 0 {
            return MissionStatus::Completed;
        }
        return MissionStatus::Expired;
    }
    if mission.completed_count > 0 {
        return MissionStatus::Completed;
    }
    MissionStatus::Active
}

fn require_admin(env: &Env, claimed: &Address) {
    let stored: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    assert!(stored == *claimed, "Caller is not admin");
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{Address, Env};

    fn setup<'a>() -> (Env, Address, MissionLedgerClient<'a>) {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000);
        let contract_id = env.register(MissionLedger, ());
        let client = MissionLedgerClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.init(&admin);
        (env, admin, client)
    }

    fn register(
        env: &Env,
        client: &MissionLedgerClient,
        admin: &Address,
        mission_id: u64,
        threshold: u32,
        expires_at: u64,
    ) {
        let operator = Address::generate(env);
        let token = Address::generate(env);
        client.register_mission(
            admin,
            &mission_id,
            &operator,
            &threshold,
            &500i128,
            &token,
            &expires_at,
        );
    }

    #[test]
    fn mission_snapshot_unknown_mission_returns_not_configured() {
        let (_env, _admin, client) = setup();

        let snap = client.mission_snapshot(&999u64);
        assert_eq!(snap.exists, false);
        assert_eq!(snap.configured, true);
        assert_eq!(snap.status, MissionStatus::NotConfigured);
        assert_eq!(snap.now, 1_000);
    }

    #[test]
    fn mission_snapshot_active_then_completed_after_claim() {
        let (env, admin, client) = setup();
        register(&env, &client, &admin, 1, 3, 5_000);

        let active = client.mission_snapshot(&1u64);
        assert_eq!(active.exists, true);
        assert_eq!(active.status, MissionStatus::Active);
        assert_eq!(active.completion_threshold, 3);

        let player = Address::generate(&env);
        client.record_progress(&player, &1u64, &3u32);
        let claimed = client.claim(&player, &1u64);
        assert_eq!(claimed, 500);

        let after = client.mission_snapshot(&1u64);
        assert_eq!(after.status, MissionStatus::Completed);
        assert_eq!(after.completed_count, 1);
        assert_eq!(after.total_claimed, 500);
    }

    #[test]
    fn reward_claim_ready_returns_ready_after_full_progress() {
        let (env, admin, client) = setup();
        register(&env, &client, &admin, 1, 2, 5_000);
        let player = Address::generate(&env);

        let r0 = client.reward_claim_ready(&1u64, &player);
        assert_eq!(r0.ready, false);
        assert_eq!(r0.reason, ClaimReadinessReason::PlayerNotEnrolled);

        client.record_progress(&player, &1u64, &1u32);
        let r1 = client.reward_claim_ready(&1u64, &player);
        assert_eq!(r1.ready, false);
        assert_eq!(r1.reason, ClaimReadinessReason::ProgressIncomplete);
        assert_eq!(r1.progress, 1);

        client.record_progress(&player, &1u64, &1u32);
        let r2 = client.reward_claim_ready(&1u64, &player);
        assert_eq!(r2.ready, true);
        assert_eq!(r2.reason, ClaimReadinessReason::Ready);
    }

    #[test]
    fn reward_claim_ready_handles_paused_state() {
        let (env, admin, client) = setup();
        register(&env, &client, &admin, 1, 1, 5_000);
        let player = Address::generate(&env);
        client.record_progress(&player, &1u64, &1u32);

        client.set_paused(&admin, &1u64, &true);
        let r = client.reward_claim_ready(&1u64, &player);
        assert_eq!(r.ready, false);
        assert_eq!(r.reason, ClaimReadinessReason::MissionPaused);
    }

    #[test]
    fn reward_claim_ready_handles_expired_state() {
        let (env, admin, client) = setup();
        register(&env, &client, &admin, 1, 1, 2_000);
        let player = Address::generate(&env);
        client.record_progress(&player, &1u64, &1u32);

        env.ledger().set_timestamp(3_000);
        let r = client.reward_claim_ready(&1u64, &player);
        assert_eq!(r.ready, false);
        assert_eq!(r.reason, ClaimReadinessReason::MissionExpired);
    }

    #[test]
    fn double_claim_is_blocked() {
        let (env, admin, client) = setup();
        register(&env, &client, &admin, 1, 1, 5_000);
        let player = Address::generate(&env);
        client.record_progress(&player, &1u64, &1u32);
        client.claim(&player, &1u64);

        let r = client.reward_claim_ready(&1u64, &player);
        assert_eq!(r.ready, false);
        assert_eq!(r.reason, ClaimReadinessReason::AlreadyClaimed);
    }

    #[test]
    fn reward_claim_ready_unknown_mission() {
        let (env, _admin, client) = setup();
        let player = Address::generate(&env);
        let r = client.reward_claim_ready(&42u64, &player);
        assert_eq!(r.ready, false);
        assert_eq!(r.reason, ClaimReadinessReason::MissionUnknown);
    }
}
