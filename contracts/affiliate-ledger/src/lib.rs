//! Stellarcade Affiliate-Ledger Contract
//!
//! Tracks referral volume and commissions for affiliate addresses.
//! Exposes a referral-volume summary and a payout-eligibility accessor.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

pub use types::*;
use storage::{DataKey, BPS_DENOMINATOR, PERSISTENT_BUMP};

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized  = 1,
    NotInitialized      = 2,
    NotAuthorized       = 3,
    AffiliateNotFound   = 4,
    AffiliateInactive   = 5,
    ContractPaused      = 6,
    InvalidAmount       = 7,
    BelowThreshold      = 8,
    Overflow            = 9,
}

const DEFAULT_MIN_THRESHOLD: i128 = 100;
const DEFAULT_COMMISSION_BPS: u32 = 500; // 5%

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct AffiliateLedgerContract;

#[contractimpl]
impl AffiliateLedgerContract {
    // ── Admin ────────────────────────────────────────────────────────────────

    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::MinPayoutThreshold, &DEFAULT_MIN_THRESHOLD);
        env.storage()
            .instance()
            .set(&DataKey::CommissionBps, &DEFAULT_COMMISSION_BPS);
        Ok(())
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Paused, &paused);
        Ok(())
    }

    pub fn set_min_payout_threshold(
        env: Env,
        admin: Address,
        threshold: i128,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage()
            .instance()
            .set(&DataKey::MinPayoutThreshold, &threshold);
        Ok(())
    }

    pub fn set_commission_bps(env: Env, admin: Address, bps: u32) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage()
            .instance()
            .set(&DataKey::CommissionBps, &bps);
        Ok(())
    }

    /// Register a new affiliate.
    pub fn register_affiliate(env: Env, admin: Address, affiliate: Address) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        assert_not_paused(&env)?;

        let record = AffiliateRecord {
            referral_count: 0,
            total_volume: 0,
            total_commission_earned: 0,
            total_commission_paid: 0,
            active: true,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Affiliate(affiliate.clone()), &record);
        env.storage().persistent().extend_ttl(
            &DataKey::Affiliate(affiliate),
            PERSISTENT_BUMP,
            PERSISTENT_BUMP,
        );
        Ok(())
    }

    /// Set an affiliate's active status.
    pub fn set_affiliate_active(
        env: Env,
        admin: Address,
        affiliate: Address,
        active: bool,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;

        let mut record: AffiliateRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Affiliate(affiliate.clone()))
            .ok_or(Error::AffiliateNotFound)?;

        record.active = active;
        env.storage()
            .persistent()
            .set(&DataKey::Affiliate(affiliate.clone()), &record);
        env.storage().persistent().extend_ttl(
            &DataKey::Affiliate(affiliate),
            PERSISTENT_BUMP,
            PERSISTENT_BUMP,
        );
        Ok(())
    }

    /// Record a referral event: increment count and add volume with commission.
    pub fn record_referral(
        env: Env,
        admin: Address,
        affiliate: Address,
        volume: i128,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        assert_not_paused(&env)?;

        if volume <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut record: AffiliateRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Affiliate(affiliate.clone()))
            .ok_or(Error::AffiliateNotFound)?;

        if !record.active {
            return Err(Error::AffiliateInactive);
        }

        let commission_bps: u32 = env
            .storage()
            .instance()
            .get(&DataKey::CommissionBps)
            .unwrap_or(DEFAULT_COMMISSION_BPS);

        let commission = volume
            .checked_mul(commission_bps as i128)
            .ok_or(Error::Overflow)?
            / BPS_DENOMINATOR;

        record.referral_count = record.referral_count.saturating_add(1);
        record.total_volume = record.total_volume.saturating_add(volume);
        record.total_commission_earned = record.total_commission_earned.saturating_add(commission);

        env.storage()
            .persistent()
            .set(&DataKey::Affiliate(affiliate.clone()), &record);
        env.storage().persistent().extend_ttl(
            &DataKey::Affiliate(affiliate),
            PERSISTENT_BUMP,
            PERSISTENT_BUMP,
        );
        Ok(())
    }

    /// Mark a payout as processed, reducing the unpaid balance.
    pub fn record_payout(
        env: Env,
        admin: Address,
        affiliate: Address,
        amount: i128,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        assert_not_paused(&env)?;

        let mut record: AffiliateRecord = env
            .storage()
            .persistent()
            .get(&DataKey::Affiliate(affiliate.clone()))
            .ok_or(Error::AffiliateNotFound)?;

        let unpaid = record.total_commission_earned - record.total_commission_paid;
        if amount > unpaid {
            return Err(Error::InvalidAmount);
        }

        record.total_commission_paid = record.total_commission_paid.saturating_add(amount);
        env.storage()
            .persistent()
            .set(&DataKey::Affiliate(affiliate.clone()), &record);
        env.storage().persistent().extend_ttl(
            &DataKey::Affiliate(affiliate),
            PERSISTENT_BUMP,
            PERSISTENT_BUMP,
        );
        Ok(())
    }

    // ── Read-only views ──────────────────────────────────────────────────────

    /// Return a referral-volume summary for an affiliate.
    ///
    /// Zero-state: `exists` false when no affiliate record is found.
    pub fn referral_volume_summary(env: Env, affiliate: Address) -> ReferralVolumeSummary {
        match env
            .storage()
            .persistent()
            .get::<DataKey, AffiliateRecord>(&DataKey::Affiliate(affiliate))
        {
            None => ReferralVolumeSummary {
                exists: false,
                referral_count: 0,
                total_volume: 0,
                total_commission_earned: 0,
                total_commission_paid: 0,
                unpaid_balance: 0,
            },
            Some(record) => {
                let unpaid_balance =
                    record.total_commission_earned - record.total_commission_paid;
                ReferralVolumeSummary {
                    exists: true,
                    referral_count: record.referral_count,
                    total_volume: record.total_volume,
                    total_commission_earned: record.total_commission_earned,
                    total_commission_paid: record.total_commission_paid,
                    unpaid_balance,
                }
            }
        }
    }

    /// Return payout eligibility for an affiliate.
    ///
    /// An affiliate is eligible when they are active and their unpaid balance
    /// meets or exceeds the minimum payout threshold.
    ///
    /// Zero-state: `eligible` false when affiliate is unknown or inactive.
    pub fn payout_eligibility(env: Env, affiliate: Address) -> PayoutEligibility {
        let minimum_threshold: i128 = env
            .storage()
            .instance()
            .get(&DataKey::MinPayoutThreshold)
            .unwrap_or(DEFAULT_MIN_THRESHOLD);

        match env
            .storage()
            .persistent()
            .get::<DataKey, AffiliateRecord>(&DataKey::Affiliate(affiliate))
        {
            None => PayoutEligibility {
                eligible: false,
                claimable_amount: 0,
                minimum_threshold,
                account_active: false,
            },
            Some(record) => {
                let claimable_amount =
                    record.total_commission_earned - record.total_commission_paid;
                let eligible = record.active && claimable_amount >= minimum_threshold;
                PayoutEligibility {
                    eligible,
                    claimable_amount,
                    minimum_threshold,
                    account_active: record.active,
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    caller.require_auth();
    if caller != &admin {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

fn assert_not_paused(env: &Env) -> Result<(), Error> {
    if env
        .storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
    {
        return Err(Error::ContractPaused);
    }
    Ok(())
}

#[cfg(test)]
mod test;
