#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};
use types::{MemberHolding, SyndicatePool};

#[contract]
pub struct LotterySyndicateContract;

#[contractimpl]
impl LotterySyndicateContract {
    pub fn create_syndicate(
        env: Env,
        manager: Address,
        share_price: u128,
        max_shares: u32,
        target_lottery: Address,
    ) -> u64 {
        manager.require_auth();

        if share_price == 0 || max_shares == 0 {
            panic!("invalid share_price or max_shares");
        }

        let id = storage::get_next_syndicate_id(&env);
        storage::set_next_syndicate_id(&env, id + 1);

        let pool = SyndicatePool {
            id,
            manager,
            share_price,
            total_shares_bought: 0,
            max_shares,
            target_lottery,
            total_prizes: 0,
        };

        storage::set_syndicate(&env, &pool);
        id
    }

    pub fn join_syndicate(env: Env, syndicate_id: u64, member: Address, shares_count: u32) {
        member.require_auth();

        let mut pool = storage::get_syndicate(&env, syndicate_id).expect("syndicate not found");

        if shares_count == 0 {
            panic!("shares_count must be > 0");
        }

        if pool.total_shares_bought + shares_count > pool.max_shares {
            panic!("purchasing exceeds max_shares limit");
        }

        pool.total_shares_bought += shares_count;
        storage::set_syndicate(&env, &pool);

        let mut holding = storage::get_member_holding(&env, syndicate_id, &member).unwrap_or(MemberHolding {
            shares: 0,
            claimed_dividend: 0,
        });

        holding.shares += shares_count;
        storage::set_member_holding(&env, syndicate_id, &member, &holding);
    }

    pub fn record_prize_winnings(env: Env, syndicate_id: u64, prize_amount: u128) {
        let mut pool = storage::get_syndicate(&env, syndicate_id).expect("syndicate not found");
        pool.manager.require_auth();

        pool.total_prizes += prize_amount;
        storage::set_syndicate(&env, &pool);
    }

    pub fn claim_dividend(env: Env, syndicate_id: u64, member: Address) -> u128 {
        member.require_auth();

        let pool = storage::get_syndicate(&env, syndicate_id).expect("syndicate not found");
        let mut holding = storage::get_member_holding(&env, syndicate_id, &member).expect("member has no shares");

        if holding.shares == 0 {
            panic!("no shares held");
        }

        if pool.total_shares_bought == 0 {
            panic!("no total shares bought");
        }

        let total_due = (pool.total_prizes * (holding.shares as u128)) / (pool.total_shares_bought as u128);
        if total_due <= holding.claimed_dividend {
            panic!("no new dividend available to claim");
        }

        let payout = total_due - holding.claimed_dividend;
        holding.claimed_dividend = total_due;
        storage::set_member_holding(&env, syndicate_id, &member, &holding);

        payout
    }

    pub fn get_member_shares(env: Env, syndicate_id: u64, member: Address) -> (u32, u128) {
        let holding = storage::get_member_holding(&env, syndicate_id, &member).unwrap_or(MemberHolding {
            shares: 0,
            claimed_dividend: 0,
        });
        (holding.shares, holding.claimed_dividend)
    }
}

#[cfg(test)]
mod test;
