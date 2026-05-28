#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    ClaimState, OutstandingClaimSummary, ReleaseQueueAccessor, ReleaseWindow,
    ReserveExposureSnapshot, VaultClaim,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Claim(u64),
    ClaimIds,
    OutstandingCount,
    OutstandingAmount,
    ReleasedCount,
    ReleasedAmount,
    CancelledCount,
    CancelledAmount,
}

#[contract]
pub struct VaultClaims;

#[contractimpl]
impl VaultClaims {
    /// Initialise the vault with an admin who can register / cancel claims.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Register a new outstanding claim against the vault.
    pub fn register_claim(
        env: Env,
        admin: Address,
        claim_id: u64,
        beneficiary: Address,
        token: Address,
        amount: i128,
        release_after: u64,
    ) {
        require_admin(&env, &admin);
        admin.require_auth();
        assert!(amount > 0, "amount must be positive");
        if storage::get_claim(&env, claim_id).is_some() {
            panic!("Claim already registered");
        }
        storage::set_claim(
            &env,
            &VaultClaim {
                claim_id,
                beneficiary,
                token,
                amount,
                release_after,
                released: false,
                cancelled: false,
            },
        );
        storage::append_claim_id(&env, claim_id);
        bump_outstanding(&env, 1, amount);
    }

    /// Release an outstanding claim once its window has opened.
    pub fn release(env: Env, beneficiary: Address, claim_id: u64) -> i128 {
        beneficiary.require_auth();
        let mut claim = storage::get_claim(&env, claim_id).expect("Claim not found");
        assert!(claim.beneficiary == beneficiary, "Caller is not beneficiary");
        assert!(!claim.released, "Already released");
        assert!(!claim.cancelled, "Claim cancelled");
        assert!(
            env.ledger().timestamp() >= claim.release_after,
            "Release window not open"
        );

        claim.released = true;
        storage::set_claim(&env, &claim);
        bump_outstanding(&env, -1, -claim.amount);
        bump_released(&env, 1, claim.amount);
        claim.amount
    }

    /// Cancel an outstanding claim. Only allowed before release.
    pub fn cancel(env: Env, admin: Address, claim_id: u64) {
        require_admin(&env, &admin);
        admin.require_auth();
        let mut claim = storage::get_claim(&env, claim_id).expect("Claim not found");
        assert!(!claim.released, "Cannot cancel a released claim");
        assert!(!claim.cancelled, "Already cancelled");
        claim.cancelled = true;
        storage::set_claim(&env, &claim);
        bump_outstanding(&env, -1, -claim.amount);
        bump_cancelled(&env, 1, claim.amount);
    }

    // ---------------------------------------------------------------------
    // Read-only accessors (the body of issue #680)
    // ---------------------------------------------------------------------

    /// Aggregate snapshot of every outstanding / released / cancelled claim.
    pub fn outstanding_claim_summary(env: Env) -> OutstandingClaimSummary {
        let configured = env.storage().instance().has(&DataKey::Admin);
        OutstandingClaimSummary {
            configured,
            outstanding_count: storage::read_u32(&env, &DataKey::OutstandingCount),
            outstanding_amount: storage::read_i128(&env, &DataKey::OutstandingAmount),
            released_count: storage::read_u32(&env, &DataKey::ReleasedCount),
            released_amount: storage::read_i128(&env, &DataKey::ReleasedAmount),
            cancelled_count: storage::read_u32(&env, &DataKey::CancelledCount),
            cancelled_amount: storage::read_i128(&env, &DataKey::CancelledAmount),
            now: env.ledger().timestamp(),
        }
    }

    /// Window snapshot for a single claim — collapses to the documented
    /// fallback when the id is unknown or the vault is unconfigured so
    /// frontend consumers can render without a separate lookup.
    pub fn release_window(env: Env, claim_id: u64) -> ReleaseWindow {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(claim) = storage::get_claim(&env, claim_id) else {
            return ReleaseWindow {
                claim_id,
                configured,
                exists: false,
                state: if configured {
                    ClaimState::Unknown
                } else {
                    ClaimState::NotConfigured
                },
                amount: 0,
                release_after: 0,
                now,
                seconds_until_releasable: 0,
            };
        };

        let state = if claim.cancelled {
            ClaimState::Cancelled
        } else if claim.released {
            ClaimState::Released
        } else if now >= claim.release_after {
            ClaimState::Releasable
        } else {
            ClaimState::Pending
        };
        let seconds_until_releasable = if state == ClaimState::Pending {
            claim.release_after - now
        } else {
            0
        };

        ReleaseWindow {
            claim_id,
            configured,
            exists: true,
            state,
            amount: claim.amount,
            release_after: claim.release_after,
            now,
            seconds_until_releasable,
        }
    }

    /// Return reserve exposure based on aggregate claim counters.
    ///
    /// `exposure_bps` is floored basis-point math over all tracked claim
    /// amounts. Empty and unconfigured vaults return zero exposure.
    pub fn reserve_exposure_snapshot(env: Env) -> ReserveExposureSnapshot {
        let outstanding_amount = storage::read_i128(&env, &DataKey::OutstandingAmount);
        let released_amount = storage::read_i128(&env, &DataKey::ReleasedAmount);
        let cancelled_amount = storage::read_i128(&env, &DataKey::CancelledAmount);
        let total_tracked_amount = outstanding_amount
            .saturating_add(released_amount)
            .saturating_add(cancelled_amount);
        let exposure_bps = if total_tracked_amount <= 0 || outstanding_amount <= 0 {
            0
        } else {
            let outstanding = u128::try_from(outstanding_amount).expect("negative outstanding");
            let total = u128::try_from(total_tracked_amount).expect("negative total");
            u32::try_from((outstanding * 10_000) / total).expect("bps overflow")
        };

        ReserveExposureSnapshot {
            configured: env.storage().instance().has(&DataKey::Admin),
            outstanding_count: storage::read_u32(&env, &DataKey::OutstandingCount),
            outstanding_amount,
            released_amount,
            cancelled_amount,
            total_tracked_amount,
            exposure_bps,
            now: env.ledger().timestamp(),
        }
    }

    /// Return the current release queue aggregate.
    ///
    /// Claims registered before the queue index existed are still reflected in
    /// `reserve_exposure_snapshot`; this queue accessor reports the indexed
    /// subset and falls back to zeros for empty or unconfigured state.
    pub fn release_queue_accessor(env: Env) -> ReleaseQueueAccessor {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);
        if !configured {
            return ReleaseQueueAccessor {
                configured: false,
                indexed_claims: 0,
                pending_count: 0,
                pending_amount: 0,
                releasable_count: 0,
                releasable_amount: 0,
                next_release_after: 0,
                now,
            };
        }

        let ids = storage::get_claim_ids(&env);
        let mut pending_count = 0u32;
        let mut pending_amount = 0i128;
        let mut releasable_count = 0u32;
        let mut releasable_amount = 0i128;
        let mut next_release_after = 0u64;

        for claim_id in ids.iter() {
            if let Some(claim) = storage::get_claim(&env, claim_id) {
                if claim.released || claim.cancelled {
                    continue;
                }
                if now >= claim.release_after {
                    releasable_count = releasable_count.saturating_add(1);
                    releasable_amount = releasable_amount.saturating_add(claim.amount);
                } else {
                    pending_count = pending_count.saturating_add(1);
                    pending_amount = pending_amount.saturating_add(claim.amount);
                    if next_release_after == 0 || claim.release_after < next_release_after {
                        next_release_after = claim.release_after;
                    }
                }
            }
        }

        ReleaseQueueAccessor {
            configured,
            indexed_claims: ids.len(),
            pending_count,
            pending_amount,
            releasable_count,
            releasable_amount,
            next_release_after,
            now,
        }
    }
}

fn require_admin(env: &Env, claimed: &Address) {
    let stored: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    assert!(stored == *claimed, "Caller is not admin");
}

fn bump_outstanding(env: &Env, count_delta: i32, amount_delta: i128) {
    let count = storage::read_u32(env, &DataKey::OutstandingCount);
    storage::write_u32(
        env,
        &DataKey::OutstandingCount,
        apply_count_delta(count, count_delta),
    );
    let amount = storage::read_i128(env, &DataKey::OutstandingAmount);
    storage::write_i128(env, &DataKey::OutstandingAmount, amount + amount_delta);
}

fn bump_released(env: &Env, count_delta: i32, amount_delta: i128) {
    let count = storage::read_u32(env, &DataKey::ReleasedCount);
    storage::write_u32(
        env,
        &DataKey::ReleasedCount,
        apply_count_delta(count, count_delta),
    );
    let amount = storage::read_i128(env, &DataKey::ReleasedAmount);
    storage::write_i128(env, &DataKey::ReleasedAmount, amount + amount_delta);
}

fn bump_cancelled(env: &Env, count_delta: i32, amount_delta: i128) {
    let count = storage::read_u32(env, &DataKey::CancelledCount);
    storage::write_u32(
        env,
        &DataKey::CancelledCount,
        apply_count_delta(count, count_delta),
    );
    let amount = storage::read_i128(env, &DataKey::CancelledAmount);
    storage::write_i128(env, &DataKey::CancelledAmount, amount + amount_delta);
}

fn apply_count_delta(count: u32, delta: i32) -> u32 {
    if delta < 0 {
        count.saturating_sub((-delta) as u32)
    } else {
        count.saturating_add(delta as u32)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{Address, Env};

    fn setup<'a>() -> (Env, Address, VaultClaimsClient<'a>) {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000);
        let contract_id = env.register(VaultClaims, ());
        let client = VaultClaimsClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.init(&admin);
        (env, admin, client)
    }

    fn register(
        env: &Env,
        client: &VaultClaimsClient,
        admin: &Address,
        claim_id: u64,
        amount: i128,
        release_after: u64,
    ) -> Address {
        let beneficiary = Address::generate(env);
        let token = Address::generate(env);
        client.register_claim(
            admin,
            &claim_id,
            &beneficiary,
            &token,
            &amount,
            &release_after,
        );
        beneficiary
    }

    #[test]
    fn outstanding_summary_starts_at_zero() {
        let (_env, _admin, client) = setup();

        let s = client.outstanding_claim_summary();
        assert_eq!(s.configured, true);
        assert_eq!(s.outstanding_count, 0);
        assert_eq!(s.outstanding_amount, 0);
        assert_eq!(s.released_count, 0);
        assert_eq!(s.cancelled_count, 0);
    }

    #[test]
    fn outstanding_summary_tracks_register_release_cancel() {
        let (env, admin, client) = setup();
        let bene1 = register(&env, &client, &admin, 1, 100, 2_000);
        let _bene2 = register(&env, &client, &admin, 2, 200, 3_000);
        let _bene3 = register(&env, &client, &admin, 3, 50, 5_000);

        let s = client.outstanding_claim_summary();
        assert_eq!(s.outstanding_count, 3);
        assert_eq!(s.outstanding_amount, 350);

        env.ledger().set_timestamp(2_500);
        let released = client.release(&bene1, &1u64);
        assert_eq!(released, 100);

        client.cancel(&admin, &3u64);

        let s = client.outstanding_claim_summary();
        assert_eq!(s.outstanding_count, 1);
        assert_eq!(s.outstanding_amount, 200);
        assert_eq!(s.released_count, 1);
        assert_eq!(s.released_amount, 100);
        assert_eq!(s.cancelled_count, 1);
        assert_eq!(s.cancelled_amount, 50);

        let exposure = client.reserve_exposure_snapshot();
        assert_eq!(exposure.outstanding_amount, 200);
        assert_eq!(exposure.total_tracked_amount, 350);
        assert_eq!(exposure.exposure_bps, 5_714);
    }

    #[test]
    fn release_window_unknown_id_returns_unknown_state() {
        let (_env, _admin, client) = setup();
        let w = client.release_window(&99u64);
        assert_eq!(w.exists, false);
        assert_eq!(w.state, ClaimState::Unknown);
        assert_eq!(w.configured, true);
        assert_eq!(w.seconds_until_releasable, 0);
    }

    #[test]
    fn release_window_reports_pending_then_releasable() {
        let (env, admin, client) = setup();
        let _bene = register(&env, &client, &admin, 1, 100, 5_000);

        let queue = client.release_queue_accessor();
        assert_eq!(queue.pending_count, 1);
        assert_eq!(queue.pending_amount, 100);
        assert_eq!(queue.releasable_count, 0);
        assert_eq!(queue.next_release_after, 5_000);

        let pending = client.release_window(&1u64);
        assert_eq!(pending.state, ClaimState::Pending);
        assert_eq!(pending.seconds_until_releasable, 4_000);

        env.ledger().set_timestamp(6_000);
        let queue = client.release_queue_accessor();
        assert_eq!(queue.pending_count, 0);
        assert_eq!(queue.releasable_count, 1);
        assert_eq!(queue.releasable_amount, 100);

        let open = client.release_window(&1u64);
        assert_eq!(open.state, ClaimState::Releasable);
        assert_eq!(open.seconds_until_releasable, 0);
    }

    #[test]
    fn reserve_exposure_and_queue_unconfigured_are_zero() {
        let env = Env::default();
        let contract_id = env.register(VaultClaims, ());
        let client = VaultClaimsClient::new(&env, &contract_id);

        let exposure = client.reserve_exposure_snapshot();
        assert_eq!(exposure.configured, false);
        assert_eq!(exposure.total_tracked_amount, 0);
        assert_eq!(exposure.exposure_bps, 0);

        let queue = client.release_queue_accessor();
        assert_eq!(queue.configured, false);
        assert_eq!(queue.indexed_claims, 0);
        assert_eq!(queue.pending_count, 0);
        assert_eq!(queue.releasable_count, 0);
    }

    #[test]
    fn release_window_reflects_released_state() {
        let (env, admin, client) = setup();
        let bene = register(&env, &client, &admin, 1, 100, 1_500);
        env.ledger().set_timestamp(2_000);
        client.release(&bene, &1u64);

        let w = client.release_window(&1u64);
        assert_eq!(w.state, ClaimState::Released);
    }

    #[test]
    fn release_window_reflects_cancelled_state() {
        let (env, admin, client) = setup();
        let _bene = register(&env, &client, &admin, 1, 100, 5_000);
        client.cancel(&admin, &1u64);

        let w = client.release_window(&1u64);
        assert_eq!(w.state, ClaimState::Cancelled);
    }
}
