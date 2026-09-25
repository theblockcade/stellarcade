use soroban_sdk::{Address, BytesN, Duration, Env, Symbol, Vec};
use crate::{Bounty, Claim, Error};

const BOUNTIES: &str = "BOUNTIES";
const CLAIMS: &str = "CLAIMS";

pub fn store_bounty(
    env: &Env,
    sponsor: Address,
    target_game: Symbol,
    target_score: i32,
    amount: i128,
    deadline: Duration,
) {
    let bounty_id = env.call_contract("hash", vec![], &[]);
    let bounty = Bounty {
        sponsor,
        target_game,
        target_score,
        amount,
        deadline,
        is_approved: false,
        is_expired: false,
    };
    env.storage().instance().set(&bounty_id, bounty);
}

pub fn store_claim(
    env: &Env,
    player: Address,
    bounty_id: BytesN<32>,
    proof_hash: BytesN<32>,
) {
    let claim = Claim {
        player,
        bounty_id,
        proof_hash,
        is_approved: false,
    };
    env.storage().instance().set(&bounty_id, claim);
}

pub fn approve_bounty(env: &Env, bounty_id: BytesN<32>) -> Result<(), Error> {
    let mut bounty: Bounty = env.storage().instance().get(&bounty_id)?;
    if bounty.is_approved {
        return Err(Error::AlreadyApproved);
    }
    if bounty.is_expired {
        return Err(Error::BountyExpired);
    }
    bounty.is_approved = true;
    env.storage().instance().set(&bounty_id, bounty);
    Ok(())
}
