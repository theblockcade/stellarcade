#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env};
use types::{BountyRecord, BountyStatus, BountySummary};

pub const DEFAULT_REVIEW_WINDOW: u64 = 86_400; // 24 hours

#[contract]
pub struct BountyBoardContract;

#[contractimpl]
impl BountyBoardContract {
    pub fn create_bounty(
        env: Env,
        creator: Address,
        reward_amount: u128,
        deadline: u64,
        desc_hash: BytesN<32>,
    ) -> u64 {
        creator.require_auth();

        if reward_amount == 0 {
            panic!("reward_amount must be greater than 0");
        }

        let bounty_id = storage::get_next_bounty_id(&env);
        storage::set_next_bounty_id(&env, bounty_id + 1);

        let record = BountyRecord {
            bounty_id,
            creator,
            hunter: None,
            reward_amount,
            deadline,
            desc_hash,
            proof_hash: None,
            submitted_at: 0,
            review_window: DEFAULT_REVIEW_WINDOW,
            status: BountyStatus::Open,
        };

        storage::set_bounty(&env, &record);
        bounty_id
    }

    pub fn claim_bounty(env: Env, bounty_id: u64, hunter: Address) {
        hunter.require_auth();

        let mut bounty = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if bounty.status != BountyStatus::Open {
            panic!("bounty is not open");
        }

        let now = env.ledger().timestamp();
        if bounty.deadline > 0 && now >= bounty.deadline {
            panic!("bounty expired");
        }

        bounty.hunter = Some(hunter);
        bounty.status = BountyStatus::Claimed;
        storage::set_bounty(&env, &bounty);
    }

    pub fn submit_work(env: Env, bounty_id: u64, hunter: Address, proof_hash: BytesN<32>) {
        hunter.require_auth();

        let mut bounty = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if bounty.status != BountyStatus::Claimed {
            panic!("bounty is not claimed");
        }

        match &bounty.hunter {
            Some(h) => {
                if *h != hunter {
                    panic!("unauthorized hunter");
                }
            }
            None => panic!("no hunter assigned"),
        }

        bounty.proof_hash = Some(proof_hash);
        bounty.submitted_at = env.ledger().timestamp();
        bounty.status = BountyStatus::Submitted;
        storage::set_bounty(&env, &bounty);
    }

    pub fn approve_work(env: Env, bounty_id: u64, creator: Address) {
        creator.require_auth();

        let mut bounty = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if bounty.creator != creator {
            panic!("unauthorized creator");
        }

        if bounty.status != BountyStatus::Submitted {
            panic!("work not submitted for review");
        }

        bounty.status = BountyStatus::Approved;
        storage::set_bounty(&env, &bounty);
    }

    pub fn claim_review_timeout(env: Env, bounty_id: u64, hunter: Address) {
        hunter.require_auth();

        let mut bounty = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if bounty.status != BountyStatus::Submitted {
            panic!("work not submitted");
        }

        match &bounty.hunter {
            Some(h) => {
                if *h != hunter {
                    panic!("unauthorized hunter");
                }
            }
            None => panic!("no hunter assigned"),
        }

        let now = env.ledger().timestamp();
        if now < bounty.submitted_at + bounty.review_window {
            panic!("review window has not expired");
        }

        bounty.status = BountyStatus::Approved;
        storage::set_bounty(&env, &bounty);
    }

    pub fn cancel_bounty(env: Env, bounty_id: u64, creator: Address) {
        creator.require_auth();

        let mut bounty = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if bounty.creator != creator {
            panic!("unauthorized creator");
        }

        if bounty.status != BountyStatus::Open {
            panic!("only open bounties can be cancelled");
        }

        let now = env.ledger().timestamp();
        if bounty.deadline > 0 && now < bounty.deadline {
            panic!("bounty deadline not reached");
        }

        bounty.status = BountyStatus::Cancelled;
        storage::set_bounty(&env, &bounty);
    }

    pub fn get_bounty(env: Env, bounty_id: u64) -> BountySummary {
        let bounty = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        BountySummary {
            bounty_id: bounty.bounty_id,
            creator: bounty.creator,
            hunter: bounty.hunter,
            reward_amount: bounty.reward_amount,
            deadline: bounty.deadline,
            desc_hash: bounty.desc_hash,
            proof_hash: bounty.proof_hash,
            submitted_at: bounty.submitted_at,
            review_window: bounty.review_window,
            status: bounty.status,
        }
    }
}

#[cfg(test)]
mod test;
