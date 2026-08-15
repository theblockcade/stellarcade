#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    CheckInCoverageSummary, ExpiryBand, GracePeriodAccessor, HolderCoverageSummary, PassRecord,
    PassStatus, PassValiditySnapshot, RedemptionReadinessSnapshot, ResaleLockStatus,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Pass(u64),
    CheckedIn(u64),
    ResaleLocked(u64),
    CheckedInCount,
    TotalHolders,
    ActiveHolders,
    ExpiredPasses,
    TotalIssued,
}

#[contract]
pub struct AttendancePass;

#[contractimpl]
impl AttendancePass {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn issue_pass(env: Env, admin: Address, pass_id: u64, holder: Address, expires_at: u64) {
        admin.require_auth();
        assert!(
            expires_at > env.ledger().timestamp(),
            "Expiry must be in future"
        );

        let record = PassRecord {
            pass_id,
            holder: holder.clone(),
            issued_at: env.ledger().timestamp(),
            expires_at,
            active: true,
        };

        storage::set_pass(&env, &record);
        storage::set_checked_in(&env, pass_id, false);
        storage::set_resale_locked(&env, pass_id, false);
        storage::increment_total_holders(&env);
        storage::increment_active_holders(&env);
        storage::increment_total_issued(&env);
    }

    pub fn expire_pass(env: Env, admin: Address, pass_id: u64) {
        admin.require_auth();

        let mut record = storage::get_pass(&env, pass_id).expect("Pass not found");
        assert!(record.active, "Already expired");

        record.active = false;
        storage::set_pass(&env, &record);
        storage::decrement_active_holders(&env);
        storage::increment_expired_passes(&env);
    }

    pub fn holder_coverage_summary(env: Env) -> HolderCoverageSummary {
        let configured = env.storage().instance().has(&DataKey::Admin);

        HolderCoverageSummary {
            configured,
            total_holders: storage::get_total_holders(&env),
            active_holders: storage::get_active_holders(&env),
            expired_passes: storage::get_expired_passes(&env),
            total_issued: storage::get_total_issued(&env),
        }
    }

    pub fn expiry_band(env: Env, pass_id: u64) -> ExpiryBand {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(record) = storage::get_pass(&env, pass_id) else {
            return ExpiryBand {
                pass_id,
                configured,
                exists: false,
                status: if configured {
                    PassStatus::Active
                } else {
                    PassStatus::NotConfigured
                },
                issued_at: 0,
                expires_at: 0,
                now,
            };
        };

        let status = if !record.active {
            PassStatus::Expired
        } else if now >= record.expires_at {
            PassStatus::Expired
        } else {
            PassStatus::Active
        };

        ExpiryBand {
            pass_id,
            configured,
            exists: true,
            status,
            issued_at: record.issued_at,
            expires_at: record.expires_at,
            now,
        }
    }

    /// Returns a readiness snapshot for redeeming a pass.
    ///
    /// Empty/missing behavior:
    /// - Unknown `pass_id` returns `exists = false` and zero-value fields.
    /// - Not-yet-configured contracts return `configured = false` and `status = NotConfigured`.
    pub fn redemption_readiness_snapshot(env: Env, pass_id: u64) -> RedemptionReadinessSnapshot {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(record) = storage::get_pass(&env, pass_id) else {
            return RedemptionReadinessSnapshot {
                pass_id,
                configured,
                exists: false,
                status: if configured {
                    PassStatus::Active
                } else {
                    PassStatus::NotConfigured
                },
                active: false,
                checked_in: false,
                resale_locked: false,
                ready_to_redeem: false,
                issued_at: 0,
                expires_at: 0,
                now,
            };
        };

        let status = if !record.active || now >= record.expires_at {
            PassStatus::Expired
        } else {
            PassStatus::Active
        };
        let checked_in = storage::is_checked_in(&env, pass_id);
        let resale_locked = storage::is_resale_locked(&env, pass_id);
        let ready_to_redeem =
            configured && status == PassStatus::Active && !checked_in && !resale_locked;

        RedemptionReadinessSnapshot {
            pass_id,
            configured,
            exists: true,
            status,
            active: record.active,
            checked_in,
            resale_locked,
            ready_to_redeem,
            issued_at: record.issued_at,
            expires_at: record.expires_at,
            now,
        }
    }

    pub fn mark_checked_in(env: Env, admin: Address, pass_id: u64) {
        admin.require_auth();
        let record = storage::get_pass(&env, pass_id).expect("Pass not found");
        assert!(record.active, "Pass not active");

        if !storage::is_checked_in(&env, pass_id) {
            storage::set_checked_in(&env, pass_id, true);
            storage::increment_checked_in_count(&env);
        }
    }

    pub fn check_in_coverage_summary(env: Env) -> CheckInCoverageSummary {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let total_issued = storage::get_total_issued(&env);
        let checked_in_count = storage::get_checked_in_count(&env);
        let unchecked_count = total_issued.saturating_sub(checked_in_count);
        let check_in_rate_bps = if total_issued == 0 {
            0
        } else {
            ((checked_in_count.saturating_mul(10_000)) / total_issued) as u32
        };

        CheckInCoverageSummary {
            configured,
            total_issued,
            checked_in_count,
            unchecked_count,
            check_in_rate_bps,
        }
    }

    /// Returns a validity snapshot for a pass.
    ///
    /// `time_remaining` uses saturating subtraction — zero when expired or missing.
    /// Unknown pass ids and unconfigured contracts return predictable zero-state values.
    pub fn pass_validity_snapshot(env: Env, pass_id: u64) -> PassValiditySnapshot {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(record) = storage::get_pass(&env, pass_id) else {
            return PassValiditySnapshot {
                pass_id,
                configured,
                exists: false,
                valid: false,
                status: if configured {
                    PassStatus::Active
                } else {
                    PassStatus::NotConfigured
                },
                issued_at: 0,
                expires_at: 0,
                time_remaining: 0,
                now,
            };
        };

        let expired = !record.active || now >= record.expires_at;
        let status = if expired {
            PassStatus::Expired
        } else {
            PassStatus::Active
        };
        let time_remaining = if expired {
            0
        } else {
            record.expires_at.saturating_sub(now)
        };

        PassValiditySnapshot {
            pass_id,
            configured,
            exists: true,
            valid: !expired,
            status,
            issued_at: record.issued_at,
            expires_at: record.expires_at,
            time_remaining,
            now,
        }
    }

    /// Returns the grace-period window for a pass.
    ///
    /// The contract does not store a per-pass grace configuration; callers
    /// supply `grace_seconds` and this function computes whether the pass is
    /// currently inside the grace window. When `grace_seconds` is zero the
    /// grace period is disabled and `in_grace_period` is always false.
    pub fn grace_period_accessor(
        env: Env,
        pass_id: u64,
        grace_seconds: u64,
    ) -> GracePeriodAccessor {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(record) = storage::get_pass(&env, pass_id) else {
            return GracePeriodAccessor {
                pass_id,
                configured,
                exists: false,
                expires_at: 0,
                grace_seconds,
                grace_deadline: 0,
                in_grace_period: false,
                now,
            };
        };

        let grace_deadline = record.expires_at.saturating_add(grace_seconds);
        let in_grace_period = grace_seconds > 0 && now >= record.expires_at && now < grace_deadline;

        GracePeriodAccessor {
            pass_id,
            configured,
            exists: true,
            expires_at: record.expires_at,
            grace_seconds,
            grace_deadline,
            in_grace_period,
            now,
        }
    }

    pub fn set_resale_lock(env: Env, admin: Address, pass_id: u64, locked: bool) {
        admin.require_auth();
        let _ = storage::get_pass(&env, pass_id).expect("Pass not found");
        storage::set_resale_locked(&env, pass_id, locked);
    }

    pub fn resale_lock_status(env: Env, pass_id: u64) -> ResaleLockStatus {
        let configured = env.storage().instance().has(&DataKey::Admin);
        match storage::get_pass(&env, pass_id) {
            Some(pass) => ResaleLockStatus {
                pass_id,
                configured,
                exists: true,
                active: pass.active,
                resale_locked: storage::is_resale_locked(&env, pass_id),
            },
            None => ResaleLockStatus {
                pass_id,
                configured,
                exists: false,
                active: false,
                resale_locked: false,
            },
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    fn setup(env: &Env) -> (Address, AttendancePassClient<'_>) {
        env.mock_all_auths();
        let contract_id = env.register(AttendancePass, ());
        let client = AttendancePassClient::new(env, &contract_id);
        let admin = Address::generate(env);
        client.init(&admin);
        (admin, client)
    }

    #[test]
    fn test_init() {
        let env = Env::default();
        let _ = setup(&env);
    }

    #[test]
    fn test_issue_and_expire_pass() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);

        let (admin, client) = setup(&env);
        let holder = Address::generate(&env);

        client.issue_pass(&admin, &1, &holder, &2000);

        let summary = client.holder_coverage_summary();
        assert_eq!(summary.total_holders, 1);
        assert_eq!(summary.active_holders, 1);

        client.expire_pass(&admin, &1);

        let summary = client.holder_coverage_summary();
        assert_eq!(summary.expired_passes, 1);
        assert_eq!(summary.active_holders, 0);
    }

    #[test]
    fn test_expiry_band_missing() {
        let env = Env::default();
        let (_admin, client) = setup(&env);

        let band = client.expiry_band(&999);
        assert!(!band.exists);
        assert!(band.configured);
    }

    #[test]
    fn test_check_in_coverage_summary_updates() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let (admin, client) = setup(&env);
        let holder_a = Address::generate(&env);
        let holder_b = Address::generate(&env);

        client.issue_pass(&admin, &1, &holder_a, &2000);
        client.issue_pass(&admin, &2, &holder_b, &2500);
        client.mark_checked_in(&admin, &1);

        let summary = client.check_in_coverage_summary();
        assert!(summary.configured);
        assert_eq!(summary.total_issued, 2);
        assert_eq!(summary.checked_in_count, 1);
        assert_eq!(summary.unchecked_count, 1);
        assert_eq!(summary.check_in_rate_bps, 5000);
    }

    #[test]
    fn test_resale_lock_status_missing_is_predictable() {
        let env = Env::default();
        let (_admin, client) = setup(&env);

        let status = client.resale_lock_status(&999);
        assert!(status.configured);
        assert!(!status.exists);
        assert!(!status.active);
        assert!(!status.resale_locked);
    }

    // ── pass_validity_snapshot ────────────────────────────────────────────

    #[test]
    fn test_pass_validity_snapshot_active_pass() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let (admin, client) = setup(&env);
        let holder = Address::generate(&env);
        client.issue_pass(&admin, &1, &holder, &5000);

        let snap = client.pass_validity_snapshot(&1);
        assert!(snap.exists);
        assert!(snap.valid);
        assert_eq!(snap.status, PassStatus::Active);
        assert_eq!(snap.time_remaining, 4000);
        assert_eq!(snap.now, 1000);
    }

    #[test]
    fn test_pass_validity_snapshot_expired_pass() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let (admin, client) = setup(&env);
        let holder = Address::generate(&env);
        client.issue_pass(&admin, &2, &holder, &2000);
        client.expire_pass(&admin, &2);

        let snap = client.pass_validity_snapshot(&2);
        assert!(!snap.valid);
        assert_eq!(snap.status, PassStatus::Expired);
        assert_eq!(snap.time_remaining, 0);
    }

    #[test]
    fn test_pass_validity_snapshot_missing_pass() {
        let env = Env::default();
        let (_admin, client) = setup(&env);

        let snap = client.pass_validity_snapshot(&999);
        assert!(!snap.exists);
        assert!(!snap.valid);
        assert_eq!(snap.time_remaining, 0);
    }

    // ── grace_period_accessor ─────────────────────────────────────────────

    #[test]
    fn test_grace_period_accessor_within_grace() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let (admin, client) = setup(&env);
        let holder = Address::generate(&env);
        // Pass expires at 1500; advance time to 1600 (100s past expiry)
        client.issue_pass(&admin, &3, &holder, &1500);
        client.expire_pass(&admin, &3);

        let mut ledger = env.ledger().get();
        ledger.timestamp = 1600;
        env.ledger().set(ledger);

        // Grace window of 200s → grace_deadline = 1700; now=1600 is inside
        let acc = client.grace_period_accessor(&3, &200);
        assert!(acc.exists);
        assert!(acc.in_grace_period);
        assert_eq!(acc.grace_deadline, 1700);
    }

    #[test]
    fn test_grace_period_accessor_outside_grace() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let (admin, client) = setup(&env);
        let holder = Address::generate(&env);
        client.issue_pass(&admin, &4, &holder, &1500);
        client.expire_pass(&admin, &4);

        let mut ledger = env.ledger().get();
        ledger.timestamp = 1800; // past grace_deadline (1500 + 200 = 1700)
        env.ledger().set(ledger);

        let acc = client.grace_period_accessor(&4, &200);
        assert!(!acc.in_grace_period);
    }

    #[test]
    fn test_grace_period_accessor_zero_grace_never_in_period() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(2000); // past expiry
        let contract_id = env.register(AttendancePass, ());
        let client = AttendancePassClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let holder = Address::generate(&env);
        // expires_at must be > now at issuance — issue at t=1000 then advance
        let mut ledger = env.ledger().get();
        ledger.timestamp = 1000;
        env.ledger().set(ledger.clone());
        client.init(&admin);
        client.issue_pass(&admin, &5, &holder, &1500);
        client.expire_pass(&admin, &5);
        ledger.timestamp = 2000;
        env.ledger().set(ledger);

        let acc = client.grace_period_accessor(&5, &0);
        assert!(!acc.in_grace_period);
    }

    #[test]
    fn test_grace_period_accessor_missing_pass() {
        let env = Env::default();
        let (_admin, client) = setup(&env);

        let acc = client.grace_period_accessor(&999, &300);
        assert!(!acc.exists);
        assert!(!acc.in_grace_period);
    }
}
