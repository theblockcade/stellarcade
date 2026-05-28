#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{
    RedemptionGapAccessor, RoundVoucherRecord, VoucherIssuanceSummary,
    VoucherRoundRecord,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Round(u32),
    Voucher(u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    RoundNotFound = 4,
    RoundPaused = 5,
    SupplyExhausted = 6,
    VoucherNotFound = 7,
    AlreadyRedeemed = 8,
    RedemptionNotOpen = 9,
}

#[contract]
pub struct RoundVouchers;

#[contractimpl]
impl RoundVouchers {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn upsert_round(
        env: Env,
        admin: Address,
        round_id: u32,
        max_vouchers: u64,
        redeemable_after: u64,
        paused: bool,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let current = storage::get_round(&env, round_id);
        storage::set_round(
            &env,
            round_id,
            &VoucherRoundRecord {
                max_vouchers,
                total_issued: current.clone().map(|r| r.total_issued).unwrap_or(0),
                total_redeemed: current.map(|r| r.total_redeemed).unwrap_or(0),
                redeemable_after,
                paused,
            },
        );
        Ok(())
    }

    pub fn issue_voucher(
        env: Env,
        admin: Address,
        voucher_id: u64,
        round_id: u32,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let mut round = storage::get_round(&env, round_id).ok_or(Error::RoundNotFound)?;
        if round.paused {
            return Err(Error::RoundPaused);
        }
        if round.max_vouchers > 0 && round.total_issued >= round.max_vouchers {
            return Err(Error::SupplyExhausted);
        }
        round.total_issued = round.total_issued.saturating_add(1);
        storage::set_round(&env, round_id, &round);
        storage::set_voucher(
            &env,
            voucher_id,
            &RoundVoucherRecord {
                round_id,
                redeemed: false,
            },
        );
        Ok(())
    }

    pub fn redeem_voucher(
        env: Env,
        admin: Address,
        voucher_id: u64,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let mut voucher = storage::get_voucher(&env, voucher_id).ok_or(Error::VoucherNotFound)?;
        if voucher.redeemed {
            return Err(Error::AlreadyRedeemed);
        }
        let mut round =
            storage::get_round(&env, voucher.round_id).ok_or(Error::RoundNotFound)?;
        if round.paused {
            return Err(Error::RoundPaused);
        }
        if env.ledger().timestamp() < round.redeemable_after {
            return Err(Error::RedemptionNotOpen);
        }
        voucher.redeemed = true;
        round.total_redeemed = round.total_redeemed.saturating_add(1);
        storage::set_voucher(&env, voucher_id, &voucher);
        storage::set_round(&env, voucher.round_id, &round);
        Ok(())
    }

    pub fn voucher_issuance_summary(env: Env, round_id: u32) -> VoucherIssuanceSummary {
        match storage::get_round(&env, round_id) {
            Some(round) => VoucherIssuanceSummary {
                round_id,
                exists: true,
                total_issued: round.total_issued,
                total_redeemed: round.total_redeemed,
                max_vouchers: round.max_vouchers,
                remaining: if round.max_vouchers == 0 {
                    u64::MAX
                } else {
                    round.max_vouchers.saturating_sub(round.total_issued)
                },
                paused: round.paused,
            },
            None => VoucherIssuanceSummary {
                round_id,
                exists: false,
                total_issued: 0,
                total_redeemed: 0,
                max_vouchers: 0,
                remaining: 0,
                paused: false,
            },
        }
    }

    pub fn redemption_gap_accessor(env: Env, voucher_id: u64) -> RedemptionGapAccessor {
        let now = env.ledger().timestamp();
        let Some(voucher) = storage::get_voucher(&env, voucher_id) else {
            return RedemptionGapAccessor {
                voucher_id,
                exists: false,
                round_id: 0,
                redeemable_after: 0,
                redeemed: false,
                paused: false,
                now,
                seconds_until_redeemable: 0,
            };
        };

        let round = storage::get_round(&env, voucher.round_id).unwrap_or(VoucherRoundRecord {
            max_vouchers: 0,
            total_issued: 0,
            total_redeemed: 0,
            redeemable_after: 0,
            paused: false,
        });
        RedemptionGapAccessor {
            voucher_id,
            exists: true,
            round_id: voucher.round_id,
            redeemable_after: round.redeemable_after,
            redeemed: voucher.redeemed,
            paused: round.paused,
            now,
            seconds_until_redeemable: if now < round.redeemable_after {
                round.redeemable_after - now
            } else {
                0
            },
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
