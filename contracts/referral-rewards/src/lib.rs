#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

pub use types::{ClaimReadiness, InviterAccount, InviterEarningsSummary};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    MinClaimAmount,
    Inviter(Address),
}

#[contract]
pub struct ReferralRewards;

#[contractimpl]
impl ReferralRewards {
    pub fn init(env: Env, admin: Address, min_claim_amount: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        assert!(min_claim_amount >= 0, "Invalid min claim");
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::MinClaimAmount, &min_claim_amount);
    }

    pub fn record_earning(
        env: Env,
        admin: Address,
        inviter: Address,
        amount: i128,
        active_referees: u32,
    ) {
        require_admin(&env, &admin);
        assert!(amount > 0, "Invalid amount");
        let mut account = storage::get_account(&env, &inviter).unwrap_or(InviterAccount {
            total_earned: 0,
            total_claimed: 0,
            pending_rewards: 0,
            active_referees: 0,
        });
        account.total_earned = account.total_earned.checked_add(amount).expect("Overflow");
        account.pending_rewards = account
            .pending_rewards
            .checked_add(amount)
            .expect("Overflow");
        account.active_referees = active_referees;
        storage::set_account(&env, &inviter, &account);
    }

    pub fn record_claim(env: Env, admin: Address, inviter: Address, amount: i128) {
        require_admin(&env, &admin);
        assert!(amount > 0, "Invalid amount");
        let mut account = storage::get_account(&env, &inviter).expect("Inviter missing");
        assert!(account.pending_rewards >= amount, "Insufficient pending");
        account.total_claimed = account.total_claimed.checked_add(amount).expect("Overflow");
        account.pending_rewards = account
            .pending_rewards
            .checked_sub(amount)
            .expect("Overflow");
        storage::set_account(&env, &inviter, &account);
    }

    pub fn inviter_earnings_summary(env: Env, inviter: Address) -> InviterEarningsSummary {
        if let Some(account) = storage::get_account(&env, &inviter) {
            InviterEarningsSummary {
                exists: true,
                total_earned: account.total_earned,
                total_claimed: account.total_claimed,
                pending_rewards: account.pending_rewards,
                active_referees: account.active_referees,
            }
        } else {
            InviterEarningsSummary {
                exists: false,
                total_earned: 0,
                total_claimed: 0,
                pending_rewards: 0,
                active_referees: 0,
            }
        }
    }

    pub fn claim_readiness(env: Env, inviter: Address) -> ClaimReadiness {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let min_claim_amount = env
            .storage()
            .instance()
            .get(&DataKey::MinClaimAmount)
            .unwrap_or(0i128);

        if !configured {
            return ClaimReadiness {
                configured: false,
                exists: false,
                ready: false,
                min_claim_amount,
                claimable_amount: 0,
                blocker: Some(String::from_str(&env, "uninitialized")),
            };
        }

        let Some(account) = storage::get_account(&env, &inviter) else {
            return ClaimReadiness {
                configured: true,
                exists: false,
                ready: false,
                min_claim_amount,
                claimable_amount: 0,
                blocker: Some(String::from_str(&env, "missing_inviter")),
            };
        };

        let ready = account.pending_rewards >= min_claim_amount && account.pending_rewards > 0;
        let blocker = if ready {
            None
        } else {
            Some(String::from_str(&env, "below_min_claim"))
        };

        ClaimReadiness {
            configured: true,
            exists: true,
            ready,
            min_claim_amount,
            claimable_amount: account.pending_rewards,
            blocker,
        }
    }
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
