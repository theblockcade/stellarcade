#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{
    ClaimPressureSnapshot, CooldownPolicy, CooldownThresholdAccessor, WalletClaimRecord,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Policy(Address),
    Claim(u64),
    ClaimIds,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    ClaimNotFound = 4,
    AlreadySettled = 5,
}

#[contract]
pub struct WalletClaimsV2;

#[contractimpl]
impl WalletClaimsV2 {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn set_cooldown_policy(
        env: Env,
        admin: Address,
        wallet: Address,
        cooldown_seconds: u64,
        threshold_amount: i128,
        paused: bool,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_policy(
            &env,
            &wallet,
            &CooldownPolicy {
                cooldown_seconds,
                threshold_amount,
                paused,
            },
        );
        Ok(())
    }

    pub fn queue_claim(
        env: Env,
        admin: Address,
        claim_id: u64,
        wallet: Address,
        amount: i128,
        available_after: u64,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_claim(
            &env,
            &WalletClaimRecord {
                claim_id,
                wallet,
                amount,
                available_after,
                settled: false,
            },
        );
        storage::append_claim_id(&env, claim_id);
        Ok(())
    }

    pub fn settle_claim(env: Env, admin: Address, claim_id: u64) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let mut claim = storage::get_claim(&env, claim_id).ok_or(Error::ClaimNotFound)?;
        if claim.settled {
            return Err(Error::AlreadySettled);
        }
        claim.settled = true;
        storage::set_claim(&env, &claim);
        Ok(())
    }

    pub fn claim_pressure_snapshot(env: Env, wallet: Address) -> ClaimPressureSnapshot {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);
        let policy = storage::get_policy(&env, &wallet);
        let ids = storage::get_claim_ids(&env);
        let mut pending_claims = 0u32;
        let mut matured_claims = 0u32;
        let mut settled_claims = 0u32;
        let mut pending_amount = 0i128;
        let mut total_claims = 0u32;

        for claim_id in ids.iter() {
            if let Some(claim) = storage::get_claim(&env, claim_id) {
                if claim.wallet != wallet {
                    continue;
                }
                total_claims = total_claims.saturating_add(1);
                if claim.settled {
                    settled_claims = settled_claims.saturating_add(1);
                } else if now >= claim.available_after {
                    matured_claims = matured_claims.saturating_add(1);
                    pending_amount = pending_amount.saturating_add(claim.amount);
                } else {
                    pending_claims = pending_claims.saturating_add(1);
                    pending_amount = pending_amount.saturating_add(claim.amount);
                }
            }
        }

        ClaimPressureSnapshot {
            wallet,
            configured,
            policy_exists: policy.is_some(),
            pending_claims,
            matured_claims,
            settled_claims,
            pending_amount,
            total_claims,
            cooldown_seconds: policy.clone().map(|p| p.cooldown_seconds).unwrap_or(0),
            threshold_amount: policy.clone().map(|p| p.threshold_amount).unwrap_or(0),
            paused: policy.map(|p| p.paused).unwrap_or(false),
            now,
        }
    }

    pub fn cooldown_threshold_accessor(
        env: Env,
        wallet: Address,
    ) -> CooldownThresholdAccessor {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);
        let Some(policy) = storage::get_policy(&env, &wallet) else {
            return CooldownThresholdAccessor {
                wallet,
                configured,
                policy_exists: false,
                paused: false,
                cooldown_seconds: 0,
                threshold_amount: 0,
                next_available_at: 0,
                seconds_until_next_window: 0,
                currently_blocked: false,
                now,
            };
        };

        let ids = storage::get_claim_ids(&env);
        let mut next_available_at = 0u64;
        for claim_id in ids.iter() {
            if let Some(claim) = storage::get_claim(&env, claim_id) {
                if claim.wallet != wallet || claim.settled {
                    continue;
                }
                if claim.amount < policy.threshold_amount || now >= claim.available_after {
                    continue;
                }
                if next_available_at == 0 || claim.available_after < next_available_at {
                    next_available_at = claim.available_after;
                }
            }
        }

        CooldownThresholdAccessor {
            wallet,
            configured,
            policy_exists: true,
            paused: policy.paused,
            cooldown_seconds: policy.cooldown_seconds,
            threshold_amount: policy.threshold_amount,
            next_available_at,
            seconds_until_next_window: if next_available_at > now {
                next_available_at - now
            } else {
                0
            },
            currently_blocked: policy.paused || next_available_at > now,
            now,
        }
    }
}

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    caller.require_auth();
    if &admin != caller {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

#[cfg(test)]
mod test;
