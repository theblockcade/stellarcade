#![no_std]
#![allow(unexpected_cfgs)]

//! Team-prize pools (#783): an admin configures a pool, marks members
//! eligible (with a per-member share), and members claim after a delay.
//!
//! - [`Self::prize_pool_coverage`] — pool-level coverage view.
//! - [`Self::claim_delay_accessor`] — per-member view of the claim window.

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    ClaimDelayInfo, ClaimDelayState, MemberRecord, PoolConfig, PoolState, PrizePoolCoverage,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Pool(u32),
    Member(Address),
}

#[contract]
pub struct TeamPrizes;

#[contractimpl]
impl TeamPrizes {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create or update a pool. On update, `total_amount` may only increase
    /// (admins can top up but cannot retroactively reduce a pool members
    /// were eligible for). Claimed totals are preserved across updates.
    pub fn upsert_pool(
        env: Env,
        admin: Address,
        pool_id: u32,
        total_amount: u128,
        claim_delay_secs: u64,
        paused: bool,
    ) {
        require_admin(&env, &admin);
        assert!(total_amount > 0, "total_amount must be positive");
        assert!(claim_delay_secs > 0, "claim_delay must be positive");

        let (claimed_amount, eligible, claimed_count) = match storage::get_pool(&env, pool_id) {
            Some(existing) => {
                assert!(
                    total_amount >= existing.total_amount,
                    "total_amount may not decrease"
                );
                (
                    existing.claimed_amount,
                    existing.eligible_member_count,
                    existing.claimed_member_count,
                )
            }
            None => (0, 0, 0),
        };

        storage::set_pool(
            &env,
            &PoolConfig {
                pool_id,
                total_amount,
                claimed_amount,
                eligible_member_count: eligible,
                claimed_member_count: claimed_count,
                claim_delay_secs,
                paused,
            },
        );
    }

    /// Grant `member` an eligibility slot for `pool_id` with the given
    /// share. Idempotent on `(pool_id, member)`: a second call panics so
    /// the eligible count stays consistent.
    pub fn grant_eligibility(
        env: Env,
        admin: Address,
        member: Address,
        pool_id: u32,
        share_amount: u128,
        eligible_at: u64,
    ) {
        require_admin(&env, &admin);
        let mut pool = storage::get_pool(&env, pool_id).expect("Pool not found");
        assert!(!pool.paused, "Pool paused");
        assert!(share_amount > 0, "share must be positive");
        assert!(
            storage::get_member(&env, &member).is_none(),
            "Member already has a record"
        );

        pool.eligible_member_count = pool
            .eligible_member_count
            .checked_add(1)
            .expect("eligible overflow");
        storage::set_pool(&env, &pool);

        storage::set_member(
            &env,
            &member,
            &MemberRecord {
                pool_id,
                eligible_at,
                share_amount,
                claimed: false,
            },
        );
    }

    /// Mark a member's share as claimed. Reverts if the claim window has
    /// not opened, the pool is paused, the member is missing, or the
    /// member has already claimed.
    pub fn claim(env: Env, member: Address) {
        member.require_auth();
        let mut record = storage::get_member(&env, &member).expect("Member not found");
        assert!(!record.claimed, "Already claimed");

        let mut pool = storage::get_pool(&env, record.pool_id).expect("Pool not found");
        assert!(!pool.paused, "Pool paused");

        let now = env.ledger().timestamp();
        let opens_at = record.eligible_at.saturating_add(pool.claim_delay_secs);
        assert!(now >= opens_at, "Claim window not yet open");

        // Accounting: paid amount = share, claimed counters +1.
        pool.claimed_amount = pool
            .claimed_amount
            .checked_add(record.share_amount)
            .expect("claimed overflow");
        pool.claimed_member_count = pool
            .claimed_member_count
            .checked_add(1)
            .expect("claimed_count overflow");
        // The claimed amount should never exceed the funded total — surface
        // a clear panic if it ever would.
        assert!(
            pool.claimed_amount <= pool.total_amount,
            "Pool over-claimed"
        );
        storage::set_pool(&env, &pool);

        record.claimed = true;
        storage::set_member(&env, &member, &record);
    }

    /// Pool-level coverage view.
    ///
    /// `coverage_bps = floor(10_000 * claimed_amount / total_amount)` when
    /// `total_amount > 0`, otherwise 0. The unclaimed member count is
    /// derived as `eligible - claimed` and surfaced as a single field.
    pub fn prize_pool_coverage(env: Env, pool_id: u32) -> PrizePoolCoverage {
        let configured = is_configured(&env);
        let Some(pool) = storage::get_pool(&env, pool_id) else {
            return PrizePoolCoverage {
                pool_id,
                configured,
                exists: false,
                state: if configured {
                    PoolState::Missing
                } else {
                    PoolState::NotConfigured
                },
                total_amount: 0,
                claimed_amount: 0,
                unclaimed_amount: 0,
                eligible_member_count: 0,
                claimed_member_count: 0,
                unclaimed_member_count: 0,
                coverage_bps: 0,
            };
        };

        let unclaimed_amount = pool.total_amount.saturating_sub(pool.claimed_amount);
        let unclaimed_member_count = pool
            .eligible_member_count
            .saturating_sub(pool.claimed_member_count);

        let coverage_bps = if pool.total_amount == 0 {
            0
        } else {
            // 10_000 fits in a u128 easily; the multiplication is safe.
            let bps_u128 = pool.claimed_amount.saturating_mul(10_000) / pool.total_amount;
            // Clamp into u32 — bps are bounded to 10_000 by definition.
            core::cmp::min(bps_u128, 10_000) as u32
        };

        PrizePoolCoverage {
            pool_id,
            configured,
            exists: true,
            state: if pool.paused {
                PoolState::Paused
            } else {
                PoolState::Active
            },
            total_amount: pool.total_amount,
            claimed_amount: pool.claimed_amount,
            unclaimed_amount,
            eligible_member_count: pool.eligible_member_count,
            claimed_member_count: pool.claimed_member_count,
            unclaimed_member_count,
            coverage_bps,
        }
    }

    /// Per-member claim-delay view. See [`ClaimDelayState`] for branches.
    pub fn claim_delay_accessor(env: Env, member: Address) -> ClaimDelayInfo {
        let configured = is_configured(&env);
        let now = env.ledger().timestamp();

        let Some(record) = storage::get_member(&env, &member) else {
            return ClaimDelayInfo {
                configured,
                member_found: false,
                pool_found: false,
                pool_id: 0,
                eligible_at: 0,
                claim_window_opens_at: 0,
                seconds_until_claim: 0,
                share_amount: 0,
                already_claimed: false,
                pool_paused: false,
                state: ClaimDelayState::NoRecord,
            };
        };

        let Some(pool) = storage::get_pool(&env, record.pool_id) else {
            return ClaimDelayInfo {
                configured,
                member_found: true,
                pool_found: false,
                pool_id: record.pool_id,
                eligible_at: record.eligible_at,
                claim_window_opens_at: 0,
                seconds_until_claim: 0,
                share_amount: record.share_amount,
                already_claimed: record.claimed,
                pool_paused: false,
                state: ClaimDelayState::MissingPool,
            };
        };

        let opens_at = record.eligible_at.saturating_add(pool.claim_delay_secs);
        let seconds_until_claim = opens_at.saturating_sub(now);

        let state = if record.claimed {
            ClaimDelayState::AlreadyClaimed
        } else if pool.paused {
            ClaimDelayState::Blocked
        } else if now < opens_at {
            ClaimDelayState::Waiting
        } else {
            ClaimDelayState::Ready
        };

        ClaimDelayInfo {
            configured,
            member_found: true,
            pool_found: true,
            pool_id: record.pool_id,
            eligible_at: record.eligible_at,
            claim_window_opens_at: opens_at,
            seconds_until_claim,
            share_amount: record.share_amount,
            already_claimed: record.claimed,
            pool_paused: pool.paused,
            state,
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
