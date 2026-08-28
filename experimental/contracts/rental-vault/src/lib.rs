#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};
use types::{RentalAgreement, RentalStatus, RentalSummary};

#[contract]
pub struct RentalVaultContract;

#[contractimpl]
impl RentalVaultContract {
    pub fn list_rental(
        env: Env,
        owner: Address,
        token_id: u64,
        fee: u128,
        collateral: u128,
        max_duration_sec: u64,
    ) -> u64 {
        owner.require_auth();

        if fee == 0 {
            panic!("fee must be > 0");
        }
        if max_duration_sec == 0 {
            panic!("max_duration_sec must be > 0");
        }

        let rental_id = storage::get_next_rental_id(&env);
        storage::set_next_rental_id(&env, rental_id + 1);

        let rental = RentalAgreement {
            rental_id,
            owner,
            token_id,
            fee_per_sec: fee,
            collateral,
            max_duration_sec,
            status: RentalStatus::Listed,
            tenant: None,
            start_ts: 0,
            end_ts: 0,
        };

        storage::set_rental(&env, &rental);
        rental_id
    }

    /// Tenant activates the rental by paying `fee_per_sec * duration_sec` in
    /// rental fees plus the fixed collateral (bookkeeping-only: the actual
    /// token transfer is the caller's responsibility, matching this repo's
    /// experimental-contract convention).
    pub fn rent_item(env: Env, tenant: Address, rental_id: u64, duration_sec: u64) {
        tenant.require_auth();

        let mut rental = storage::get_rental(&env, rental_id).expect("rental not found");

        if rental.status != RentalStatus::Listed {
            panic!("item is not available for rent");
        }
        if duration_sec == 0 || duration_sec > rental.max_duration_sec {
            panic!("duration_sec must be > 0 and within max_duration_sec");
        }

        let now = env.ledger().timestamp();

        rental.status = RentalStatus::Active;
        rental.tenant = Some(tenant);
        rental.start_ts = now;
        rental.end_ts = now + duration_sec;

        storage::set_rental(&env, &rental);
    }

    /// Tenant returns the item before (or at) expiry. Collateral is
    /// refunded to the tenant and the accrued fee is owed to the owner
    /// (settlement is the caller's responsibility; this records the clean
    /// return).
    pub fn return_item(env: Env, tenant: Address, rental_id: u64) {
        tenant.require_auth();

        let mut rental = storage::get_rental(&env, rental_id).expect("rental not found");

        if rental.status != RentalStatus::Active {
            panic!("rental is not active");
        }
        if rental.tenant != Some(tenant) {
            panic!("only the current tenant can return this item");
        }

        let now = env.ledger().timestamp();
        if now > rental.end_ts {
            panic!("rental period has already expired; owner must reclaim instead");
        }

        rental.status = RentalStatus::Returned;
        storage::set_rental(&env, &rental);
    }

    /// Owner reclaims the asset once the rental period has expired without
    /// a clean return. Since the tenant defaulted on returning by the
    /// deadline, the collateral is forfeited to the owner instead of being
    /// refunded.
    pub fn reclaim_expired_item(env: Env, owner: Address, rental_id: u64) {
        owner.require_auth();

        let mut rental = storage::get_rental(&env, rental_id).expect("rental not found");

        if rental.owner != owner {
            panic!("only the listing owner can reclaim this item");
        }
        if rental.status != RentalStatus::Active {
            panic!("rental is not active");
        }

        let now = env.ledger().timestamp();
        if now <= rental.end_ts {
            panic!("cannot reclaim before the rental period has expired");
        }

        rental.status = RentalStatus::Defaulted;
        storage::set_rental(&env, &rental);
    }

    pub fn get_rental_agreement(env: Env, rental_id: u64) -> RentalSummary {
        let rental = storage::get_rental(&env, rental_id).expect("rental not found");
        RentalSummary {
            rental_id: rental.rental_id,
            owner: rental.owner,
            token_id: rental.token_id,
            fee_per_sec: rental.fee_per_sec,
            collateral: rental.collateral,
            max_duration_sec: rental.max_duration_sec,
            status: rental.status,
            tenant: rental.tenant,
            start_ts: rental.start_ts,
            end_ts: rental.end_ts,
        }
    }
}

#[cfg(test)]
mod test;
