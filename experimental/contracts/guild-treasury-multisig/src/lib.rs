#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec};
use types::{ProposalRecord, ProposalSummary};

#[contract]
pub struct GuildTreasuryMultisigContract;

#[contractimpl]
impl GuildTreasuryMultisigContract {
    pub fn init_treasury(env: Env, signers: Vec<Address>, threshold: u32, timelock_sec: u64) {
        if env.storage().instance().has(&storage::DataKey::Signers) {
            panic!("treasury already initialized");
        }
        if signers.is_empty() {
            panic!("signers list cannot be empty");
        }
        if threshold == 0 || threshold > signers.len() {
            panic!("invalid confirmation threshold");
        }

        storage::set_treasury_config(&env, &signers, threshold, timelock_sec);
    }

    pub fn propose_transfer(
        env: Env,
        proposer: Address,
        recipient: Address,
        amount: u128,
        memo: Symbol,
    ) -> u64 {
        proposer.require_auth();

        if !storage::is_signer(&env, &proposer) {
            panic!("only authorized signers can propose transfers");
        }
        if amount == 0 {
            panic!("amount must be greater than 0");
        }

        let proposal_id = storage::get_next_proposal_id(&env);
        storage::set_next_proposal_id(&env, proposal_id + 1);

        let mut confirmations = Vec::new(&env);
        confirmations.push_back(proposer.clone());

        let record = ProposalRecord {
            proposal_id,
            proposer,
            recipient,
            amount,
            memo,
            confirmations,
            created_at: env.ledger().timestamp(),
            executed: false,
        };

        storage::set_proposal(&env, &record);
        proposal_id
    }

    pub fn confirm_proposal(env: Env, proposal_id: u64, signer: Address) {
        signer.require_auth();

        if !storage::is_signer(&env, &signer) {
            panic!("only authorized signers can confirm proposals");
        }

        let mut proposal = storage::get_proposal(&env, proposal_id).expect("proposal not found");
        if proposal.executed {
            panic!("proposal already executed");
        }

        if proposal.confirmations.contains(&signer) {
            panic!("signer already confirmed");
        }

        proposal.confirmations.push_back(signer);
        storage::set_proposal(&env, &proposal);
    }

    pub fn execute_proposal(env: Env, proposal_id: u64, caller: Address) {
        caller.require_auth();

        let mut proposal = storage::get_proposal(&env, proposal_id).expect("proposal not found");
        if proposal.executed {
            panic!("proposal already executed");
        }

        let threshold = storage::get_threshold(&env);
        if proposal.confirmations.len() < threshold {
            panic!("confirmation threshold not met");
        }

        let timelock_sec = storage::get_timelock_sec(&env);
        let now = env.ledger().timestamp();
        if now < proposal.created_at + timelock_sec {
            panic!("execution timelock delay has not elapsed");
        }

        proposal.executed = true;
        storage::set_proposal(&env, &proposal);
    }

    pub fn get_proposal(env: Env, proposal_id: u64) -> ProposalSummary {
        let proposal = storage::get_proposal(&env, proposal_id).expect("proposal not found");
        let threshold = storage::get_threshold(&env);
        let timelock_sec = storage::get_timelock_sec(&env);

        ProposalSummary {
            proposal_id: proposal.proposal_id,
            proposer: proposal.proposer,
            recipient: proposal.recipient,
            amount: proposal.amount,
            memo: proposal.memo,
            confirmations_count: proposal.confirmations.len(),
            threshold,
            created_at: proposal.created_at,
            timelock_sec,
            executed: proposal.executed,
        }
    }
}

#[cfg(test)]
mod test;
