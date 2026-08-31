#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, BytesN, Env, Vec};

pub use types::{Dispute, DisputeStatus, DisputeSummary, DisputeVerdict, JurorVote};

const TRIBUNAL_SIZE: u32 = 3;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotStakedJuror = 1,
    InsufficientStake = 2,
    DisputeNotFound = 3,
    DisputeNotOpen = 4,
    NotAssignedToTribunal = 5,
    AlreadyVoted = 6,
    CannotVoteOnOwnDispute = 7,
    NotResolved = 8,
    MathOverflow = 9,
}

#[contract]
pub struct EscrowDisputeDao;

#[contractimpl]
impl EscrowDisputeDao {
    pub fn stake_juror(env: Env, juror: Address, amount: i128) -> Result<(), Error> {
        juror.require_auth();
        if amount <= 0 {
            return Err(Error::InsufficientStake);
        }

        let current = storage::read_juror_stake(&env, &juror);
        let new_stake = current + amount;
        storage::write_juror_stake(&env, &juror, new_stake);

        let mut jurors = storage::read_staked_jurors(&env);
        if !jurors.contains(&juror) {
            jurors.push_back(juror);
            storage::write_staked_jurors(&env, &jurors);
        }

        Ok(())
    }

    pub fn open_dispute(
        env: Env,
        reporter: Address,
        match_id: u64,
        escrow_amount: i128,
        evidence: BytesN<32>,
    ) -> Result<u64, Error> {
        reporter.require_auth();
        if escrow_amount <= 0 {
            return Err(Error::InsufficientStake);
        }

        let dispute_id = storage::next_dispute_id(&env);
        let staked_jurors = storage::read_staked_jurors(&env);
        let mut tribunal: Vec<Address> = Vec::new(&env);

        let count = staked_jurors.len().min(TRIBUNAL_SIZE);
        for i in 0..count {
            tribunal.push_back(staked_jurors.get_unchecked(i));
        }

        let dispute = Dispute {
            dispute_id,
            reporter: reporter.clone(),
            match_id,
            escrow_amount,
            evidence,
            tribunal: tribunal.clone(),
            votes: soroban_sdk::Map::new(&env),
            status: DisputeStatus::Open,
        };

        storage::write_dispute(&env, &dispute);
        Ok(dispute_id)
    }

    pub fn cast_juror_vote(
        env: Env,
        dispute_id: u64,
        juror: Address,
        vote: JurorVote,
    ) -> Result<(), Error> {
        juror.require_auth();

        let mut dispute = storage::read_dispute(&env, dispute_id).ok_or(Error::DisputeNotFound)?;

        if dispute.status == DisputeStatus::Resolved {
            return Err(Error::DisputeNotOpen);
        }

        if juror == dispute.reporter {
            return Err(Error::CannotVoteOnOwnDispute);
        }

        if !dispute.tribunal.contains(&juror) {
            return Err(Error::NotAssignedToTribunal);
        }

        if dispute.votes.contains_key(juror.clone()) {
            return Err(Error::AlreadyVoted);
        }

        dispute.votes.set(juror, vote);
        dispute.status = DisputeStatus::Voting;
        storage::write_dispute(&env, &dispute);
        Ok(())
    }

    pub fn resolve_dispute(env: Env, dispute_id: u64) -> Result<DisputeVerdict, Error> {
        let mut dispute = storage::read_dispute(&env, dispute_id).ok_or(Error::DisputeNotFound)?;

        if dispute.status == DisputeStatus::Resolved {
            return Err(Error::DisputeNotOpen);
        }

        let mut p1_votes: u32 = 0;
        let mut p2_votes: u32 = 0;
        let mut _refund_votes: u32 = 0;

        for juror in dispute.tribunal.iter() {
            if let Some(vote) = dispute.votes.get(juror.clone()) {
                match vote {
                    JurorVote::Player1Wins => p1_votes += 1,
                    JurorVote::Player2Wins => p2_votes += 1,
                    JurorVote::InvalidateRefund => _refund_votes += 1,
                }
            }
        }

        let winner = if p1_votes >= 2 {
            JurorVote::Player1Wins
        } else if p2_votes >= 2 {
            JurorVote::Player2Wins
        } else {
            JurorVote::InvalidateRefund
        };

        dispute.status = DisputeStatus::Resolved;
        storage::write_dispute(&env, &dispute);

        Ok(DisputeVerdict {
            dispute_id,
            winner,
            resolved: true,
        })
    }

    pub fn get_dispute(env: Env, dispute_id: u64) -> Result<DisputeSummary, Error> {
        let dispute = storage::read_dispute(&env, dispute_id).ok_or(Error::DisputeNotFound)?;
        Ok(DisputeSummary {
            dispute_id: dispute.dispute_id,
            reporter: dispute.reporter,
            match_id: dispute.match_id,
            escrow_amount: dispute.escrow_amount,
            status: dispute.status,
        })
    }
}
