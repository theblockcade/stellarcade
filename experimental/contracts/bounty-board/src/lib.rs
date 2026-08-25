#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, BytesN, Env, Vec};

use types::{BountyRecord, BountyStatus, BountySummary, OptionalBountyStatus};

pub const BUMP_AMOUNT: u32 = 518_400;
pub const LIFETIME_THRESHOLD: u32 = 259_200;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    ReviewWindow,
    NextBountyId,
    AllIds,
    Bounty(u64),
}

#[contract]
pub struct BountyBoard;

#[contractimpl]
impl BountyBoard {
    /// Initialize the contract. Panics if already initialized.
    pub fn init(env: Env, admin: Address, token: Address, review_window: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        if review_window == 0 {
            panic!("review_window must be > 0");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage()
            .instance()
            .set(&DataKey::ReviewWindow, &review_window);
        env.storage().instance().set(&DataKey::NextBountyId, &1u64);
    }

    /// Create a bounty, escrowing `reward_amount` tokens from `creator` into
    /// the contract. Returns the new bounty id.
    pub fn create_bounty(
        env: Env,
        creator: Address,
        reward_amount: i128,
        deadline: u32,
        desc_hash: BytesN<32>,
    ) -> u64 {
        creator.require_auth();

        if reward_amount <= 0 {
            panic!("reward_amount must be > 0");
        }
        if deadline <= env.ledger().sequence() {
            panic!("deadline must be in the future");
        }

        // Lock the reward inside the contract until approved or timeout.
        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("contract not initialized");
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&creator, &env.current_contract_address(), &reward_amount);

        let bounty_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextBountyId)
            .unwrap_or(1u64);
        env.storage()
            .instance()
            .set(&DataKey::NextBountyId, &(bounty_id + 1));

        let record = BountyRecord {
            bounty_id,
            creator: creator.clone(),
            reward_amount,
            deadline,
            desc_hash,
            status: BountyStatus::Open,
            hunter: None,
            proof_hash: None,
            review_deadline: 0,
        };

        storage::set_bounty(&env, &record);
        storage::push_bounty_id(&env, bounty_id);

        bounty_id
    }

    /// Claim an open bounty as a hunter. Only possible before `deadline`.
    pub fn claim_bounty(env: Env, bounty_id: u64, hunter: Address) {
        hunter.require_auth();

        let mut record = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if record.status != BountyStatus::Open {
            panic!("bounty is not open");
        }
        if env.ledger().sequence() > record.deadline {
            panic!("bounty deadline has passed");
        }

        record.hunter = Some(hunter);
        record.status = BountyStatus::Claimed;
        storage::set_bounty(&env, &record);
    }

    /// Submit a completion deliverable (proof hash) for a claimed bounty.
    /// Only the hunter who claimed the bounty may submit.
    pub fn submit_work(env: Env, bounty_id: u64, hunter: Address, proof_hash: BytesN<32>) {
        hunter.require_auth();

        let mut record = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if record.status != BountyStatus::Claimed {
            panic!("bounty is not claimed");
        }
        if record.hunter.as_ref() != Some(&hunter) {
            panic!("only the claiming hunter can submit work");
        }

        let review_window: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ReviewWindow)
            .expect("contract not initialized");
        record.proof_hash = Some(proof_hash);
        record.review_deadline = env.ledger().sequence() + review_window;
        record.status = BountyStatus::Submitted;
        storage::set_bounty(&env, &record);
    }

    /// Approve submitted work and release the escrowed reward to the hunter.
    /// Only the creator may approve, and only within the review window.
    pub fn approve_work(env: Env, bounty_id: u64, creator: Address) {
        creator.require_auth();

        let mut record = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if record.status != BountyStatus::Submitted {
            panic!("bounty has no work awaiting review");
        }
        if record.creator != creator {
            panic!("only the creator can approve work");
        }
        if env.ledger().sequence() > record.review_deadline {
            panic!("review window has expired; the hunter may claim the timeout payout");
        }

        let hunter = record.hunter.clone().expect("bounty has no hunter");
        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("contract not initialized");
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(
            &env.current_contract_address(),
            &hunter,
            &record.reward_amount,
        );

        record.status = BountyStatus::Completed;
        storage::set_bounty(&env, &record);
    }

    /// Claim the escrowed reward via the review timeout: if the creator does
    /// not review within the review window, the hunter can release the payout.
    pub fn claim_review_timeout(env: Env, bounty_id: u64, hunter: Address) {
        hunter.require_auth();

        let mut record = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if record.status != BountyStatus::Submitted {
            panic!("bounty has no work awaiting review");
        }
        if record.hunter.as_ref() != Some(&hunter) {
            panic!("only the claiming hunter can claim the review timeout");
        }
        if env.ledger().sequence() <= record.review_deadline {
            panic!("review window has not expired yet");
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("contract not initialized");
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(
            &env.current_contract_address(),
            &hunter,
            &record.reward_amount,
        );

        record.status = BountyStatus::Completed;
        storage::set_bounty(&env, &record);
    }

    /// Cancel an expired, unclaimed bounty and refund the escrowed reward to
    /// the creator. Only possible after `deadline` and while still `Open`.
    pub fn cancel_bounty(env: Env, bounty_id: u64, creator: Address) {
        creator.require_auth();

        let mut record = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        if record.status != BountyStatus::Open {
            panic!("only open bounties can be cancelled");
        }
        if record.creator != creator {
            panic!("only the creator can cancel a bounty");
        }
        if env.ledger().sequence() <= record.deadline {
            panic!("bounty has not expired yet");
        }

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::Token)
            .expect("contract not initialized");
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(
            &env.current_contract_address(),
            &creator,
            &record.reward_amount,
        );

        record.status = BountyStatus::Cancelled;
        storage::set_bounty(&env, &record);
    }

    /// Return the review window (in ledgers) configured for this contract.
    pub fn get_review_window(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ReviewWindow)
            .unwrap_or(0)
    }

    // ── Read-only methods ──────────────────────────────────────────────────────

    /// Return the full state of a single bounty. No auth required.
    /// Returns a zero-state `BountySummary` (exists: false) when the ID is unknown.
    pub fn get_bounty(env: Env, bounty_id: u64) -> BountySummary {
        match storage::get_bounty(&env, bounty_id) {
            Some(r) => BountySummary {
                bounty_id,
                exists: true,
                creator: Some(r.creator),
                reward_amount: Some(r.reward_amount),
                deadline: Some(r.deadline),
                desc_hash: Some(r.desc_hash),
                status: OptionalBountyStatus::Some(r.status),
                hunter: r.hunter,
                proof_hash: r.proof_hash,
                review_deadline: Some(r.review_deadline),
            },
            None => BountySummary {
                bounty_id,
                exists: false,
                creator: None,
                reward_amount: None,
                deadline: None,
                desc_hash: None,
                status: OptionalBountyStatus::None,
                hunter: None,
                proof_hash: None,
                review_deadline: None,
            },
        }
    }

    /// Return all bounty ids created on this contract. No auth required.
    pub fn get_all_bounty_ids(env: Env) -> Vec<u64> {
        storage::get_all_ids(&env)
    }
}

#[cfg(test)]
mod test;
