#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, token, Address, BytesN, Env, Symbol};

pub use types::{Bounty, BountyStatus, Claim, Error};
use types::{BountyApproved, BountyPosted, BountyRefunded, ClaimSubmitted, Initialized};

#[contract]
pub struct BountyEscrow;

#[contractimpl]
impl BountyEscrow {
    /// Initialize the bounty escrow contract with an authorized oracle and token address.
    pub fn initialize(env: Env, oracle: Address, token: Address) -> Result<(), Error> {
        if storage::is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }

        oracle.require_auth();

        storage::set_oracle(&env, &oracle);
        storage::set_token(&env, &token);
        storage::set_initialized(&env);

        Initialized { oracle, token }.publish(&env);

        Ok(())
    }

    /// Post a new bounty for an arcade game achievement.
    pub fn post_bounty(
        env: Env,
        sponsor: Address,
        target_game: Symbol,
        target_score: u64,
        amount: i128,
        deadline: u64,
    ) -> Result<u64, Error> {
        storage::require_initialized(&env)?;
        sponsor.require_auth();

        if amount <= 0 {
            return Err(Error::InvalidInput);
        }

        if deadline <= env.ledger().timestamp() {
            return Err(Error::InvalidInput);
        }

        let token_client = token::Client::new(&env, &storage::get_token(&env));
        let contract_address = env.current_contract_address();
        token_client.transfer(&sponsor, &contract_address, &amount);

        let bounty_id = storage::get_next_bounty_id(&env);
        storage::set_next_bounty_id(&env, bounty_id.checked_add(1).ok_or(Error::InvalidInput)?);

        let bounty = Bounty {
            bounty_id,
            sponsor: sponsor.clone(),
            target_game: target_game.clone(),
            target_score,
            total_amount: amount,
            remaining_amount: amount,
            deadline,
            status: BountyStatus::Open,
        };

        storage::set_bounty(&env, bounty_id, &bounty);

        BountyPosted {
            bounty_id,
            sponsor,
            target_game,
            target_score,
            amount,
            deadline,
        }
        .publish(&env);

        Ok(bounty_id)
    }

    /// Submit a claim with proof hash for an active bounty.
    pub fn submit_claim(
        env: Env,
        player: Address,
        bounty_id: u64,
        proof_hash: BytesN<32>,
    ) -> Result<(), Error> {
        storage::require_initialized(&env)?;
        player.require_auth();

        let mut bounty = storage::get_bounty(&env, bounty_id)?;

        if bounty.status == BountyStatus::Refunded {
            return Err(Error::AlreadyRefunded);
        }

        if bounty.status == BountyStatus::Completed {
            return Err(Error::AlreadyCompleted);
        }

        if env.ledger().timestamp() > bounty.deadline {
            return Err(Error::BountyExpired);
        }

        if storage::has_claim(&env, bounty_id) {
            let existing_claim = storage::get_claim(&env, bounty_id)?;
            if existing_claim.approved {
                return Err(Error::AlreadyClaimed);
            }
        }

        let claim = Claim {
            player: player.clone(),
            bounty_id,
            proof_hash: proof_hash.clone(),
            timestamp: env.ledger().timestamp(),
            approved: false,
        };

        storage::set_claim(&env, bounty_id, &claim);

        if bounty.status == BountyStatus::Open {
            bounty.status = BountyStatus::ClaimSubmitted;
            storage::set_bounty(&env, bounty_id, &bounty);
        }

        ClaimSubmitted {
            bounty_id,
            player,
            proof_hash,
        }
        .publish(&env);

        Ok(())
    }

    /// Verify a submitted claim and release the entire remaining bounty prize pool.
    pub fn approve_bounty(env: Env, verifier: Address, bounty_id: u64) -> Result<i128, Error> {
        storage::require_initialized(&env)?;
        verifier.require_auth();

        let mut bounty = storage::get_bounty(&env, bounty_id)?;

        let oracle = storage::get_oracle(&env);
        if verifier != bounty.sponsor && verifier != oracle {
            return Err(Error::NotAuthorized);
        }

        if bounty.status == BountyStatus::Refunded {
            return Err(Error::AlreadyRefunded);
        }

        if bounty.status == BountyStatus::Completed {
            return Err(Error::AlreadyCompleted);
        }

        let mut claim = storage::get_claim(&env, bounty_id)?;
        if claim.approved {
            return Err(Error::AlreadyClaimed);
        }

        let payout = bounty.remaining_amount;
        if payout <= 0 {
            return Err(Error::InsufficientRemainingAmount);
        }

        let token_client = token::Client::new(&env, &storage::get_token(&env));
        let contract_address = env.current_contract_address();
        token_client.transfer(&contract_address, &claim.player, &payout);

        claim.approved = true;
        storage::set_claim(&env, bounty_id, &claim);

        bounty.remaining_amount = 0;
        bounty.status = BountyStatus::Completed;
        storage::set_bounty(&env, bounty_id, &bounty);

        BountyApproved {
            bounty_id,
            verifier,
            player: claim.player,
            payout_amount: payout,
            remaining_amount: 0,
        }
        .publish(&env);

        Ok(payout)
    }

    /// Verify a submitted claim and release a partial bounty amount for tiered objectives.
    pub fn approve_partial_bounty(
        env: Env,
        verifier: Address,
        bounty_id: u64,
        payout_amount: i128,
    ) -> Result<i128, Error> {
        storage::require_initialized(&env)?;
        verifier.require_auth();

        let mut bounty = storage::get_bounty(&env, bounty_id)?;

        let oracle = storage::get_oracle(&env);
        if verifier != bounty.sponsor && verifier != oracle {
            return Err(Error::NotAuthorized);
        }

        if bounty.status == BountyStatus::Refunded {
            return Err(Error::AlreadyRefunded);
        }

        if bounty.status == BountyStatus::Completed {
            return Err(Error::AlreadyCompleted);
        }

        if payout_amount <= 0 || payout_amount > bounty.remaining_amount {
            return Err(Error::InvalidInput);
        }

        let mut claim = storage::get_claim(&env, bounty_id)?;

        let token_client = token::Client::new(&env, &storage::get_token(&env));
        let contract_address = env.current_contract_address();
        token_client.transfer(&contract_address, &claim.player, &payout_amount);

        let new_remaining = bounty
            .remaining_amount
            .checked_sub(payout_amount)
            .ok_or(Error::InvalidInput)?;

        bounty.remaining_amount = new_remaining;
        if new_remaining == 0 {
            bounty.status = BountyStatus::Completed;
            claim.approved = true;
        } else {
            bounty.status = BountyStatus::PartiallyPaid;
        }

        storage::set_bounty(&env, bounty_id, &bounty);
        storage::set_claim(&env, bounty_id, &claim);

        BountyApproved {
            bounty_id,
            verifier,
            player: claim.player,
            payout_amount,
            remaining_amount: new_remaining,
        }
        .publish(&env);

        Ok(payout_amount)
    }

    /// Refund remaining escrowed funds to sponsor after bounty expiration deadline.
    pub fn refund_bounty(env: Env, sponsor: Address, bounty_id: u64) -> Result<i128, Error> {
        storage::require_initialized(&env)?;
        sponsor.require_auth();

        let mut bounty = storage::get_bounty(&env, bounty_id)?;

        if sponsor != bounty.sponsor {
            return Err(Error::NotAuthorized);
        }

        if env.ledger().timestamp() <= bounty.deadline {
            return Err(Error::BountyNotExpired);
        }

        if bounty.status == BountyStatus::Refunded {
            return Err(Error::AlreadyRefunded);
        }

        if bounty.status == BountyStatus::Completed {
            return Err(Error::AlreadyCompleted);
        }

        let refund_amount = bounty.remaining_amount;
        if refund_amount <= 0 {
            return Err(Error::InsufficientRemainingAmount);
        }

        let token_client = token::Client::new(&env, &storage::get_token(&env));
        let contract_address = env.current_contract_address();
        token_client.transfer(&contract_address, &sponsor, &refund_amount);

        bounty.remaining_amount = 0;
        bounty.status = BountyStatus::Refunded;
        storage::set_bounty(&env, bounty_id, &bounty);

        BountyRefunded {
            bounty_id,
            sponsor,
            amount: refund_amount,
        }
        .publish(&env);

        Ok(refund_amount)
    }

    /// Reclaim expired funds for a bounty. Convenience alias for refund_bounty.
    pub fn reclaim_expired(env: Env, sponsor: Address, bounty_id: u64) -> Result<i128, Error> {
        Self::refund_bounty(env, sponsor, bounty_id)
    }

    /// Return the stored bounty record by ID.
    pub fn get_bounty(env: Env, bounty_id: u64) -> Result<Bounty, Error> {
        storage::require_initialized(&env)?;
        storage::get_bounty(&env, bounty_id)
    }

    /// Return the claim associated with a bounty ID.
    pub fn get_claim(env: Env, bounty_id: u64) -> Result<Claim, Error> {
        storage::require_initialized(&env)?;
        storage::get_claim(&env, bounty_id)
    }

    /// Return the authorized oracle address.
    pub fn get_oracle(env: Env) -> Result<Address, Error> {
        storage::require_initialized(&env)?;
        Ok(storage::get_oracle(&env))
    }

    /// Return the escrow token address.
    pub fn get_token(env: Env) -> Result<Address, Error> {
        storage::require_initialized(&env)?;
        Ok(storage::get_token(&env))
    }
}
