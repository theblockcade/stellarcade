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

    pub fn issue_pass(
        env: Env,
        admin: Address,
        pass_id: u64,
        holder: Address,
        expires_at: u64,
    ) {
        admin.require_auth();
        assert!(expires_at > env.ledger().timestamp(), "Expiry must be in future");

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
    pub fn redemption_readiness_snapshot(
        env: Env,
        pass_id: u64,
    ) -> RedemptionReadinessSnapshot {
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
        let ready_to_redeem = configured && status == PassStatus::Active && !checked_in && !resale_locked;

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
        let status = if expired { PassStatus::Expired } else { PassStatus::Active };
        let time_remaining = if expired { 0 } else { record.expires_at.saturating_sub(now) };

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
    pub fn grace_period_accessor(env: Env, pass_id: u64, grace_seconds: u64) -> GracePeriodAccessor {
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
        let in_grace_period = grace_seconds > 0
            && now >= record.expires_at
            && now < grace_deadline;

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

    #[test]
    fn test_init() {
        let env = Env::default();
        let admin = Address::random(&env);
        AttendancePass::init(env.clone(), admin);
    }

    #[test]
    fn test_issue_and_expire_pass() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);

        let admin = Address::random(&env);
        let holder = Address::random(&env);

        AttendancePass::init(env.clone(), admin.clone());
        AttendancePass::issue_pass(env.clone(), admin.clone(), 1, holder.clone(), 2000);

        let summary = AttendancePass::holder_coverage_summary(env.clone());
        assert_eq!(summary.total_holders, 1);
        assert_eq!(summary.active_holders, 1);

        AttendancePass::expire_pass(env.clone(), admin, 1);

        let summary = AttendancePass::holder_coverage_summary(env);
        assert_eq!(summary.expired_passes, 1);
        assert_eq!(summary.active_holders, 0);
    }

    #[test]
    fn test_expiry_band_missing() {
        let env = Env::default();
        let admin = Address::random(&env);
        AttendancePass::init(env.clone(), admin);

        let band = AttendancePass::expiry_band(env, 999);
        assert_eq!(band.exists, false);
        assert_eq!(band.configured, true);
    }

    #[test]
    fn test_check_in_coverage_summary_updates() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let admin = Address::random(&env);
        let holder_a = Address::random(&env);
        let holder_b = Address::random(&env);

        AttendancePass::init(env.clone(), admin.clone());
        AttendancePass::issue_pass(env.clone(), admin.clone(), 1, holder_a, 2000);
        AttendancePass::issue_pass(env.clone(), admin.clone(), 2, holder_b, 2500);
        AttendancePass::mark_checked_in(env.clone(), admin, 1);

        let summary = AttendancePass::check_in_coverage_summary(env);
        assert_eq!(summary.configured, true);
        assert_eq!(summary.total_issued, 2);
        assert_eq!(summary.checked_in_count, 1);
        assert_eq!(summary.unchecked_count, 1);
        assert_eq!(summary.check_in_rate_bps, 5000);
    }

    #[test]
    fn test_resale_lock_status_missing_is_predictable() {
        let env = Env::default();
        let admin = Address::random(&env);
        AttendancePass::init(env.clone(), admin);

        let status = AttendancePass::resale_lock_status(env, 999);
        assert_eq!(status.configured, true);
        assert_eq!(status.exists, false);
        assert_eq!(status.active, false);
        assert_eq!(status.resale_locked, false);
    }

    // ── pass_validity_snapshot ────────────────────────────────────────────

    #[test]
    fn test_pass_validity_snapshot_active_pass() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let admin = Address::random(&env);
        let holder = Address::random(&env);
        AttendancePass::init(env.clone(), admin.clone());
        AttendancePass::issue_pass(env.clone(), admin, 1, holder, 5000);

        let snap = AttendancePass::pass_validity_snapshot(env.clone(), 1);
        assert_eq!(snap.exists, true);
        assert_eq!(snap.valid, true);
        assert_eq!(snap.status, PassStatus::Active);
        assert_eq!(snap.time_remaining, 4000);
        assert_eq!(snap.now, 1000);
    }

    #[test]
    fn test_pass_validity_snapshot_expired_pass() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let admin = Address::random(&env);
        let holder = Address::random(&env);
        AttendancePass::init(env.clone(), admin.clone());
        AttendancePass::issue_pass(env.clone(), admin.clone(), 2, holder, 2000);
        AttendancePass::expire_pass(env.clone(), admin, 2);

        let snap = AttendancePass::pass_validity_snapshot(env.clone(), 2);
        assert_eq!(snap.valid, false);
        assert_eq!(snap.status, PassStatus::Expired);
        assert_eq!(snap.time_remaining, 0);
    }

    #[test]
    fn test_pass_validity_snapshot_missing_pass() {
        let env = Env::default();
        let admin = Address::random(&env);
        AttendancePass::init(env.clone(), admin);

        let snap = AttendancePass::pass_validity_snapshot(env, 999);
        assert_eq!(snap.exists, false);
        assert_eq!(snap.valid, false);
        assert_eq!(snap.time_remaining, 0);
    }

    // ── grace_period_accessor ─────────────────────────────────────────────

    #[test]
    fn test_grace_period_accessor_within_grace() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let admin = Address::random(&env);
        let holder = Address::random(&env);
        AttendancePass::init(env.clone(), admin.clone());
        // Pass expires at 1500; advance time to 1600 (100s past expiry)
        AttendancePass::issue_pass(env.clone(), admin.clone(), 3, holder, 1500);
        AttendancePass::expire_pass(env.clone(), admin, 3);

        let mut ledger = env.ledger().get();
        ledger.timestamp = 1600;
        env.ledger().set(ledger);

        // Grace window of 200s → grace_deadline = 1700; now=1600 is inside
        let acc = AttendancePass::grace_period_accessor(env.clone(), 3, 200);
        assert_eq!(acc.exists, true);
        assert_eq!(acc.in_grace_period, true);
        assert_eq!(acc.grace_deadline, 1700);
    }

    #[test]
    fn test_grace_period_accessor_outside_grace() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);
        let admin = Address::random(&env);
        let holder = Address::random(&env);
        AttendancePass::init(env.clone(), admin.clone());
        AttendancePass::issue_pass(env.clone(), admin.clone(), 4, holder, 1500);
        AttendancePass::expire_pass(env.clone(), admin, 4);

        let mut ledger = env.ledger().get();
        ledger.timestamp = 1800; // past grace_deadline (1500 + 200 = 1700)
        env.ledger().set(ledger);

        let acc = AttendancePass::grace_period_accessor(env.clone(), 4, 200);
        assert_eq!(acc.in_grace_period, false);
    }

    #[test]
    fn test_grace_period_accessor_zero_grace_never_in_period() {
        let env = Env::default();
        env.ledger().set_timestamp(2000); // past expiry
        let admin = Address::random(&env);
        let holder = Address::random(&env);
        AttendancePass::init(env.clone(), admin.clone());
        // expires_at must be > now at issuance — issue at t=1000 then advance
        let mut ledger = env.ledger().get();
        ledger.timestamp = 1000;
        env.ledger().set(ledger.clone());
        AttendancePass::issue_pass(env.clone(), admin.clone(), 5, holder, 1500);
        AttendancePass::expire_pass(env.clone(), admin, 5);
        ledger.timestamp = 2000;
        env.ledger().set(ledger);

        let acc = AttendancePass::grace_period_accessor(env.clone(), 5, 0);
        assert_eq!(acc.in_grace_period, false);
    }

    #[test]
    fn test_grace_period_accessor_missing_pass() {
        let env = Env::default();
        let admin = Address::random(&env);
        AttendancePass::init(env.clone(), admin);

        let acc = AttendancePass::grace_period_accessor(env, 999, 300);
        assert_eq!(acc.exists, false);
        assert_eq!(acc.in_grace_period, false);
    }
}
