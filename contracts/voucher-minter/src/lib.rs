//! Stellarcade Voucher Minter Contract
//!
//! Manages voucher issuance with supply tracking and per-voucher claim-expiry.
//!
//! ## Read-only accessors
//! - `issuance_summary(voucher_type_id)` — total issued, remaining supply, paused state.
//! - `claim_expiry(voucher_id)` — expiry ledger, claimed flag, live expiry status.
//!
//! ## Zero-state behaviour
//! Both accessors return `exists = false` with zeroed numeric fields for
//! unknown ids so callers never need to handle a missing-key error.
//!
//! ## Rounding / supply conventions
//! - `remaining` is `u64::MAX` when `max_supply == 0` (uncapped).
//! - `is_expired` is computed against the current ledger sequence at read time.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{ClaimExpiry, IssuanceSummary, VoucherRecord, VoucherTypeRecord};

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    VoucherType(u32),
    Voucher(u64),
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    SupplyExhausted = 4,
    VoucherTypePaused = 5,
    VoucherTypeNotFound = 6,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct VoucherMinter;

#[contractimpl]
impl VoucherMinter {
    /// Initialize the contract. May only be called once.
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Define or update a voucher type. Admin only.
    ///
    /// `max_supply = 0` means uncapped. Existing `total_issued` is preserved
    /// on update so supply counters remain consistent.
    pub fn upsert_voucher_type(
        env: Env,
        admin: Address,
        type_id: u32,
        max_supply: u64,
        paused: bool,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let total_issued = storage::get_voucher_type(&env, type_id)
            .map(|r| r.total_issued)
            .unwrap_or(0);
        storage::set_voucher_type(
            &env,
            type_id,
            &VoucherTypeRecord {
                max_supply,
                total_issued,
                paused,
            },
        );
        Ok(())
    }

    /// Issue a voucher instance. Admin only.
    ///
    /// Increments `total_issued` on the parent type and writes the per-voucher
    /// record. Fails if the type is paused or supply is exhausted.
    pub fn issue_voucher(
        env: Env,
        admin: Address,
        voucher_id: u64,
        type_id: u32,
        expires_at_ledger: u32,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let mut vtype = storage::get_voucher_type(&env, type_id)
            .ok_or(Error::VoucherTypeNotFound)?;
        if vtype.paused {
            return Err(Error::VoucherTypePaused);
        }
        if vtype.max_supply > 0 && vtype.total_issued >= vtype.max_supply {
            return Err(Error::SupplyExhausted);
        }
        vtype.total_issued = vtype.total_issued.saturating_add(1);
        storage::set_voucher_type(&env, type_id, &vtype);
        storage::set_voucher(
            &env,
            voucher_id,
            &VoucherRecord {
                voucher_type_id: type_id,
                expires_at_ledger,
                claimed: false,
            },
        );
        Ok(())
    }

    /// Mark a voucher as claimed. Admin only.
    pub fn claim_voucher(env: Env, admin: Address, voucher_id: u64) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let mut record = storage::get_voucher(&env, voucher_id)
            .ok_or(Error::VoucherTypeNotFound)?;
        record.claimed = true;
        storage::set_voucher(&env, voucher_id, &record);
        Ok(())
    }

    /// Return an issuance summary for `voucher_type_id`.
    ///
    /// Unknown type ids return `exists = false` with zeroed fields.
    /// `remaining` is `u64::MAX` when the type is uncapped (`max_supply == 0`).
    pub fn issuance_summary(env: Env, voucher_type_id: u32) -> IssuanceSummary {
        match storage::get_voucher_type(&env, voucher_type_id) {
            Some(record) => {
                let remaining = if record.max_supply == 0 {
                    u64::MAX
                } else {
                    record.max_supply.saturating_sub(record.total_issued)
                };
                IssuanceSummary {
                    voucher_type_id,
                    exists: true,
                    total_issued: record.total_issued,
                    max_supply: record.max_supply,
                    remaining,
                    paused: record.paused,
                }
            }
            None => IssuanceSummary {
                voucher_type_id,
                exists: false,
                total_issued: 0,
                max_supply: 0,
                remaining: 0,
                paused: false,
            },
        }
    }

    /// Return claim-expiry details for `voucher_id`.
    ///
    /// Unknown voucher ids return `exists = false` with zeroed fields.
    /// `is_expired` is computed against the current ledger sequence at read
    /// time: `current_ledger >= expires_at_ledger`.
    pub fn claim_expiry(env: Env, voucher_id: u64) -> ClaimExpiry {
        match storage::get_voucher(&env, voucher_id) {
            Some(record) => {
                let current_ledger = env.ledger().sequence();
                let is_expired = current_ledger >= record.expires_at_ledger;
                ClaimExpiry {
                    voucher_id,
                    exists: true,
                    expires_at_ledger: record.expires_at_ledger,
                    claimed: record.claimed,
                    is_expired,
                }
            }
            None => ClaimExpiry {
                voucher_id,
                exists: false,
                expires_at_ledger: 0,
                claimed: false,
                is_expired: false,
            },
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod test;
