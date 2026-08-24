#![no_std]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env};
pub use types::{Bounty, BountyStatus, BountySummary};

pub const DEFAULT_REVIEW_TIMEOUT_SECONDS: u64 = 7 * 24 * 60 * 60; // 7 days

#[contract]
pub struct BountyBoard;

#[contractimpl]
impl BountyBoard {
    /// Create a new bounty with reward amount, deadline timestamp, and description hash.
    pub fn create_bounty(
        env: Env,
        creator: Address,
        reward_amount: i128,
        deadline: u64,
        desc_hash: BytesN<32>,
        review_timeout_seconds: u64,
    ) -> u64 {
        creator.require_auth();
        if reward_amount <= 0 {
            panic!("Reward amount must be greater than zero");
        }
        if deadline <= env.ledger().timestamp() {
            panic!("Deadline must be in the future");
        }

        let timeout = if review_timeout_seconds == 0 {
            DEFAULT_REVIEW_TIMEOUT_SECONDS
        } else {
            review_timeout_seconds
        };

        let id = storage::increment_next_bounty_id(&env);
        let bounty = Bounty {
            id,
            creator,
            hunter: None,
            reward_amount,
            deadline,
            desc_hash,
            proof_hash: None,
            submitted_at: 0,
            review_timeout_seconds: timeout,
            status: BountyStatus::Open,
        };

        storage::set_bounty(&env, id, &bounty);
        id
    }

    /// Claim an open bounty as a worker/hunter.
    pub fn claim_bounty(env: Env, bounty_id: u64, hunter: Address) {
        hunter.require_auth();
        let mut bounty = storage::get_bounty(&env, bounty_id).expect("Bounty not found");
        if bounty.status != BountyStatus::Open {
            panic!("Bounty is not open");
        }
        if env.ledger().timestamp() > bounty.deadline {
            panic!("Bounty deadline has passed");
        }

        bounty.hunter = Some(hunter);
        bounty.status = BountyStatus::Claimed;
        storage::set_bounty(&env, bounty_id, &bounty);
    }

    /// Submit deliverable proof hash for a claimed bounty.
    pub fn submit_work(env: Env, bounty_id: u64, hunter: Address, proof_hash: BytesN<32>) {
        hunter.require_auth();
        let mut bounty = storage::get_bounty(&env, bounty_id).expect("Bounty not found");
        if bounty.status != BountyStatus::Claimed {
            panic!("Bounty is not in claimed state");
        }
        if bounty.hunter.as_ref() != Some(&hunter) {
            panic!("Only assigned hunter can submit work");
        }

        bounty.proof_hash = Some(proof_hash);
        bounty.submitted_at = env.ledger().timestamp();
        bounty.status = BountyStatus::Submitted;
        storage::set_bounty(&env, bounty_id, &bounty);
    }

    /// Approve submitted work and finalize payout.
    pub fn approve_work(env: Env, bounty_id: u64, creator: Address) {
        creator.require_auth();
        let mut bounty = storage::get_bounty(&env, bounty_id).expect("Bounty not found");
        if bounty.creator != creator {
            panic!("Only creator can approve work");
        }
        if bounty.status != BountyStatus::Submitted {
            panic!("Bounty is not in submitted state");
        }

        bounty.status = BountyStatus::Approved;
        storage::set_bounty(&env, bounty_id, &bounty);
    }

    /// Auto-release payment if creator fails to review submitted work within review window.
    pub fn claim_review_timeout(env: Env, bounty_id: u64, hunter: Address) {
        hunter.require_auth();
        let mut bounty = storage::get_bounty(&env, bounty_id).expect("Bounty not found");
        if bounty.hunter.as_ref() != Some(&hunter) {
            panic!("Only assigned hunter can claim review timeout");
        }
        if bounty.status != BountyStatus::Submitted {
            panic!("Bounty is not in submitted state");
        }

        let now = env.ledger().timestamp();
        if now < bounty.submitted_at + bounty.review_timeout_seconds {
            panic!("Review window is still active");
        }

        bounty.status = BountyStatus::TimeoutClaimed;
        storage::set_bounty(&env, bounty_id, &bounty);
    }

    /// Cancel an expired, unclaimed bounty and refund creator.
    pub fn cancel_bounty(env: Env, bounty_id: u64, creator: Address) {
        creator.require_auth();
        let mut bounty = storage::get_bounty(&env, bounty_id).expect("Bounty not found");
        if bounty.creator != creator {
            panic!("Only creator can cancel bounty");
        }
        if bounty.status != BountyStatus::Open {
            panic!("Only open bounties can be cancelled");
        }
        if env.ledger().timestamp() <= bounty.deadline {
            panic!("Cannot cancel before deadline expiry");
        }

        bounty.status = BountyStatus::Cancelled;
        storage::set_bounty(&env, bounty_id, &bounty);
    }

    /// Get full bounty record.
    pub fn get_bounty(env: Env, bounty_id: u64) -> Bounty {
        storage::get_bounty(&env, bounty_id).expect("Bounty not found")
    }

    /// Get light summary view of bounty.
    pub fn get_bounty_summary(env: Env, bounty_id: u64) -> BountySummary {
        let b = storage::get_bounty(&env, bounty_id).expect("Bounty not found");
        BountySummary {
            id: b.id,
            creator: b.creator,
            hunter: b.hunter,
            reward_amount: b.reward_amount,
            deadline: b.deadline,
            status: b.status,
        }
    }
}
