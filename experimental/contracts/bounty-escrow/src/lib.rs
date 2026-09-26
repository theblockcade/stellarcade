#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, BytesN,
    Env, Symbol, Vec,
};

pub use types::{Bounty, BountyStatus, Claim, Config, PayoutTier};

const MAX_ORACLES: u32 = 16;
const MAX_TIERS: u32 = 16;
const MAX_BOUNTY_LIFETIME_SECONDS: u64 = 30 * 24 * 60 * 60;
pub(crate) const TTL_THRESHOLD: u32 = 259_200;
pub(crate) const TTL_BUMP: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Config,
    NextBountyId,
    Bounty(u64),
    Claim(u64, u64),
    Proof(BytesN<32>),
    SubmittedProof(u64, Address, BytesN<32>),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidOracleConfig = 3,
    Unauthorized = 4,
    InvalidAmount = 5,
    InvalidDeadline = 6,
    InvalidTiers = 7,
    BountyNotFound = 8,
    BountyClosed = 9,
    ClaimNotFound = 10,
    ClaimAlreadyPaid = 11,
    DuplicateProof = 12,
    ScoreBelowTarget = 13,
    InsufficientPool = 14,
    DuplicateApproval = 15,
    MathOverflow = 16,
    TierAlreadyPaid = 17,
}

#[contractevent]
pub struct BountyPosted {
    #[topic]
    pub bounty_id: u64,
    pub sponsor: Address,
    pub total_amount: i128,
    pub deadline: u64,
}

#[contractevent]
pub struct ClaimSubmitted {
    #[topic]
    pub bounty_id: u64,
    #[topic]
    pub claim_id: u64,
    pub player: Address,
    pub score: u32,
    pub tier_index: u32,
    pub proof_hash: BytesN<32>,
    pub payout_amount: i128,
}

#[contractevent]
pub struct ClaimPaid {
    #[topic]
    pub bounty_id: u64,
    #[topic]
    pub claim_id: u64,
    pub player: Address,
    pub amount: i128,
}

#[contractevent]
pub struct BountyRefunded {
    #[topic]
    pub bounty_id: u64,
    pub sponsor: Address,
    pub amount: i128,
}

#[contract]
pub struct BountyEscrow;

#[contractimpl]
impl BountyEscrow {
    /// Initialize the escrow token and the independent-oracle approval policy.
    pub fn initialize(
        env: Env,
        admin: Address,
        token_address: Address,
        oracles: Vec<Address>,
        oracle_threshold: u32,
    ) -> Result<(), Error> {
        admin.require_auth();
        if env.storage().instance().has(&DataKey::Config) {
            return Err(Error::AlreadyInitialized);
        }
        if oracles.is_empty()
            || oracles.len() > MAX_ORACLES
            || oracle_threshold == 0
            || oracle_threshold > oracles.len()
        {
            return Err(Error::InvalidOracleConfig);
        }
        for (index, oracle) in oracles.iter().enumerate() {
            if oracles.iter().skip(index + 1).any(|other| other == oracle) {
                return Err(Error::InvalidOracleConfig);
            }
        }

        storage::set_config(
            &env,
            &Config {
                admin,
                token: token_address,
                oracles,
                oracle_threshold,
            },
        );
        env.storage().instance().set(&DataKey::NextBountyId, &1u64);
        Ok(())
    }

    /// Fund a single-target-score bounty. An approved claim receives `amount`.
    pub fn post_bounty(
        env: Env,
        sponsor: Address,
        target_game: Symbol,
        target_score: u32,
        amount: i128,
        deadline: u64,
    ) -> Result<u64, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        if target_score == 0 {
            return Err(Error::InvalidTiers);
        }
        let mut tiers = Vec::new(&env);
        tiers.push_back(PayoutTier {
            min_score: target_score,
            amount,
        });
        create_bounty(&env, sponsor, target_game, tiers, deadline)
    }

    /// Fund a pool with score-based payouts. The highest satisfied score tier
    /// sets the payout for each approved claim; total payouts cannot exceed the
    /// amount deposited.
    pub fn post_bounty_with_tiers(
        env: Env,
        sponsor: Address,
        target_game: Symbol,
        tiers: Vec<PayoutTier>,
        deadline: u64,
    ) -> Result<u64, Error> {
        create_bounty(&env, sponsor, target_game, tiers, deadline)
    }

    /// Submit a score and its session-proof hash for oracle or sponsor review.
    pub fn submit_claim(
        env: Env,
        player: Address,
        bounty_id: u64,
        score: u32,
        proof_hash: BytesN<32>,
    ) -> Result<u64, Error> {
        player.require_auth();
        let mut bounty = storage::bounty(&env, bounty_id)?;
        ensure_open_and_live(&env, &bounty)?;
        if storage::proof_was_used(&env, &proof_hash)
            || storage::claim_was_submitted(&env, bounty_id, &player, &proof_hash)
        {
            return Err(Error::DuplicateProof);
        }

        let mut payout_amount = 0i128;
        let mut tier_index = 0u32;
        for (index, tier) in bounty.tiers.iter().enumerate() {
            if score >= tier.min_score {
                payout_amount = tier.amount;
                tier_index = index as u32;
            }
        }
        if payout_amount == 0 {
            return Err(Error::ScoreBelowTarget);
        }
        if bounty.paid_tiers.get(tier_index).unwrap_or(false) {
            return Err(Error::TierAlreadyPaid);
        }
        if bounty.remaining_amount < payout_amount {
            return Err(Error::InsufficientPool);
        }

        let claim_id = bounty.next_claim_id;
        bounty.next_claim_id = claim_id.checked_add(1).ok_or(Error::MathOverflow)?;
        storage::set_bounty(&env, &bounty);
        storage::mark_claim_submitted(&env, bounty_id, &player, &proof_hash);
        let claim = Claim {
            id: claim_id,
            bounty_id,
            player,
            score,
            tier_index,
            proof_hash,
            payout_amount,
            approvals: Vec::new(&env),
            paid: false,
        };
        storage::set_claim(&env, &claim);
        ClaimSubmitted {
            bounty_id,
            claim_id,
            player: claim.player,
            score,
            tier_index,
            proof_hash: claim.proof_hash,
            payout_amount: claim.payout_amount,
        }
        .publish(&env);
        Ok(claim_id)
    }

    /// Record an oracle approval, or let the sponsor directly approve the
    /// claim. Oracle approvals pay only after the configured threshold.
    /// Returns zero while more oracle approvals are needed, otherwise the
    /// amount transferred to the claimant.
    pub fn approve_bounty(
        env: Env,
        verifier: Address,
        bounty_id: u64,
        claim_id: u64,
    ) -> Result<i128, Error> {
        verifier.require_auth();
        let config = storage::config(&env)?;
        let mut bounty = storage::bounty(&env, bounty_id)?;
        ensure_open_and_live(&env, &bounty)?;
        let mut claim = storage::claim(&env, bounty_id, claim_id)?;
        if claim.paid {
            return Err(Error::ClaimAlreadyPaid);
        }
        if bounty.paid_tiers.get(claim.tier_index).unwrap_or(false) {
            return Err(Error::TierAlreadyPaid);
        }
        if storage::proof_was_used(&env, &claim.proof_hash) {
            return Err(Error::DuplicateProof);
        }

        let sponsor_approved = verifier == bounty.sponsor;
        if !sponsor_approved {
            if !storage::oracle_is_configured(&config, &verifier) {
                return Err(Error::Unauthorized);
            }
            if claim.approvals.iter().any(|approved| approved == verifier) {
                return Err(Error::DuplicateApproval);
            }
            claim.approvals.push_back(verifier.clone());
        }

        if !sponsor_approved && claim.approvals.len() < config.oracle_threshold {
            storage::set_claim(&env, &claim);
            return Ok(0);
        }

        if bounty.remaining_amount < claim.payout_amount {
            return Err(Error::InsufficientPool);
        }
        bounty.remaining_amount = bounty
            .remaining_amount
            .checked_sub(claim.payout_amount)
            .ok_or(Error::MathOverflow)?;
        if bounty.remaining_amount == 0 {
            bounty.status = BountyStatus::Exhausted;
        }
        let mut paid_tiers = Vec::new(&env);
        for (index, paid) in bounty.paid_tiers.iter().enumerate() {
            paid_tiers.push_back(paid || index as u32 == claim.tier_index);
        }
        bounty.paid_tiers = paid_tiers;
        claim.paid = true;

        // Persist the terminal state before calling the token contract. If the
        // transfer fails, Soroban rolls back the whole invocation atomically.
        storage::set_claim(&env, &claim);
        storage::set_bounty(&env, &bounty);
        storage::mark_proof_used(&env, &claim.proof_hash);
        token::Client::new(&env, &config.token).transfer(
            &env.current_contract_address(),
            &claim.player,
            &claim.payout_amount,
        );
        ClaimPaid {
            bounty_id,
            claim_id,
            player: claim.player,
            amount: claim.payout_amount,
        }
        .publish(&env);
        Ok(claim.payout_amount)
    }

    /// Return any unspent pool balance to its sponsor after the deadline.
    pub fn refund_expired(env: Env, sponsor: Address, bounty_id: u64) -> Result<i128, Error> {
        sponsor.require_auth();
        let config = storage::config(&env)?;
        let mut bounty = storage::bounty(&env, bounty_id)?;
        if bounty.sponsor != sponsor {
            return Err(Error::Unauthorized);
        }
        if env.ledger().timestamp() <= bounty.deadline {
            return Err(Error::InvalidDeadline);
        }
        if bounty.status != BountyStatus::Open {
            return Err(Error::BountyClosed);
        }

        let refund = bounty.remaining_amount;
        if refund <= 0 {
            return Err(Error::InsufficientPool);
        }
        bounty.remaining_amount = 0;
        bounty.status = BountyStatus::Refunded;
        storage::set_bounty(&env, &bounty);
        token::Client::new(&env, &config.token).transfer(
            &env.current_contract_address(),
            &sponsor,
            &refund,
        );
        BountyRefunded {
            bounty_id,
            sponsor,
            amount: refund,
        }
        .publish(&env);
        Ok(refund)
    }

    /// Read a bounty record without requiring authorization.
    pub fn get_bounty(env: Env, bounty_id: u64) -> Result<Bounty, Error> {
        storage::bounty(&env, bounty_id)
    }

    /// Read a claim record without requiring authorization.
    pub fn get_claim(env: Env, bounty_id: u64, claim_id: u64) -> Result<Claim, Error> {
        storage::claim(&env, bounty_id, claim_id)
    }

    /// Read the immutable token/oracle policy without requiring authorization.
    pub fn get_config(env: Env) -> Result<Config, Error> {
        storage::config(&env)
    }
}

fn create_bounty(
    env: &Env,
    sponsor: Address,
    target_game: Symbol,
    tiers: Vec<PayoutTier>,
    deadline: u64,
) -> Result<u64, Error> {
    sponsor.require_auth();
    let config = storage::config(env)?;
    if tiers.is_empty() || tiers.len() > MAX_TIERS {
        return Err(Error::InvalidTiers);
    }
    let now = env.ledger().timestamp();
    let latest_deadline = now
        .checked_add(MAX_BOUNTY_LIFETIME_SECONDS)
        .ok_or(Error::MathOverflow)?;
    if deadline <= now || deadline > latest_deadline {
        return Err(Error::InvalidDeadline);
    }

    let mut total_amount = 0i128;
    let mut previous_score = 0u32;
    let mut previous_amount = 0i128;
    let mut paid_tiers = Vec::new(env);
    for tier in tiers.iter() {
        if tier.min_score <= previous_score || tier.amount <= 0 || tier.amount < previous_amount {
            return Err(Error::InvalidTiers);
        }
        total_amount = total_amount
            .checked_add(tier.amount)
            .ok_or(Error::MathOverflow)?;
        previous_score = tier.min_score;
        previous_amount = tier.amount;
        paid_tiers.push_back(false);
    }

    let id = storage::next_bounty_id(env);
    let next_id = id.checked_add(1).ok_or(Error::MathOverflow)?;
    storage::set_next_bounty_id(env, next_id);
    token::Client::new(env, &config.token).transfer(
        &sponsor,
        env.current_contract_address(),
        &total_amount,
    );
    storage::set_bounty(
        env,
        &Bounty {
            id,
            sponsor: sponsor.clone(),
            target_game,
            deadline,
            total_amount,
            remaining_amount: total_amount,
            tiers,
            paid_tiers,
            next_claim_id: 1,
            status: BountyStatus::Open,
        },
    );
    BountyPosted {
        bounty_id: id,
        sponsor,
        total_amount,
        deadline,
    }
    .publish(env);
    Ok(id)
}

fn ensure_open_and_live(env: &Env, bounty: &Bounty) -> Result<(), Error> {
    if bounty.status != BountyStatus::Open {
        return Err(Error::BountyClosed);
    }
    if env.ledger().timestamp() > bounty.deadline {
        return Err(Error::InvalidDeadline);
    }
    Ok(())
}
