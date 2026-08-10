#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, Vec};

mod storage;
mod types;
#[cfg(test)]
mod test;

pub use types::{ClaimReadiness, MemberPayout, TeamPayoutCoverage};

#[contract]
pub struct SquadRewards;

#[contractimpl]
impl SquadRewards {
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_none() {
            storage::set_admin(&env, &admin);
        }
    }

    pub fn fund_pool(env: Env, admin: Address, amount: i128) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_pool(&env, amount);
        }
    }

    pub fn register_members(env: Env, admin: Address, payouts: Vec<MemberPayout>) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_members(&env, &payouts);
        }
    }

    pub fn claim(env: Env, member_index: u32) {
        let mut members = storage::get_members(&env);
        for i in 0..members.len() {
            let mut m = members.get(i).unwrap();
            if m.member_index == member_index && !m.claimed {
                m.claimed = true;
                members.set(i, m);
                storage::set_members(&env, &members);
                return;
            }
        }
    }

    pub fn team_payout_coverage(env: Env) -> TeamPayoutCoverage {
        let members = storage::get_members(&env);
        let total_members = members.len();
        let mut claimed_count = 0u32;
        let mut total_amount = 0i128;
        let mut claimed_amount = 0i128;
        for i in 0..members.len() {
            let m = members.get(i).unwrap();
            total_amount += m.amount;
            if m.claimed {
                claimed_count += 1;
                claimed_amount += m.amount;
            }
        }
        TeamPayoutCoverage {
            total_members,
            claimed_count,
            unclaimed_count: total_members - claimed_count,
            total_amount,
            claimed_amount,
        }
    }

    pub fn claim_readiness(env: Env) -> ClaimReadiness {
        let members = storage::get_members(&env);
        let pool = storage::get_pool(&env);
        ClaimReadiness {
            is_ready: members.len() > 0 && pool > 0,
            members_registered: members.len(),
            pool_funded: pool > 0,
            total_pool: pool,
        }
    }
}
