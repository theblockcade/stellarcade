#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};
use types::{EscrowState, EscrowSummary, Milestone, MilestoneStatus};

#[contract]
pub struct EscrowMilestoneContract;

#[contractimpl]
impl EscrowMilestoneContract {
    pub fn create_escrow(
        env: Env,
        client: Address,
        contractor: Address,
        arbiter: Address,
        total_amount: u128,
        milestones: Vec<Milestone>,
    ) -> u64 {
        client.require_auth();

        if total_amount == 0 || milestones.is_empty() {
            panic!("invalid total_amount or empty milestones");
        }

        let mut total_bps: u32 = 0;
        for i in 0..milestones.len() {
            let m = milestones.get(i).unwrap();
            total_bps += m.basis_points;
        }

        if total_bps != 10000 {
            panic!("milestone basis points must sum exactly to 10000 (100%)");
        }

        let id = storage::get_next_escrow_id(&env);
        storage::set_next_escrow_id(&env, id + 1);

        let escrow = EscrowSummary {
            id,
            client,
            contractor,
            arbiter,
            total_amount,
            amount_released: 0,
            state: EscrowState::Active,
            milestones,
        };

        storage::set_escrow(&env, &escrow);
        id
    }

    pub fn submit_milestone(env: Env, escrow_id: u64, milestone_idx: u32, proof_hash: String) {
        let mut escrow = storage::get_escrow(&env, escrow_id).expect("escrow not found");
        escrow.contractor.require_auth();

        if escrow.state != EscrowState::Active {
            panic!("escrow is not in active state");
        }

        if milestone_idx >= escrow.milestones.len() {
            panic!("invalid milestone_idx");
        }

        // Sequential check: all previous milestones must be approved
        for i in 0..milestone_idx {
            let prev = escrow.milestones.get(i).unwrap();
            if prev.status != MilestoneStatus::Approved {
                panic!("previous milestones must be approved first");
            }
        }

        let mut milestone = escrow.milestones.get(milestone_idx).unwrap();
        if milestone.status != MilestoneStatus::Pending {
            panic!("milestone already submitted or approved");
        }

        milestone.status = MilestoneStatus::Submitted;
        milestone.proof_hash = proof_hash;
        escrow.milestones.set(milestone_idx, milestone);

        storage::set_escrow(&env, &escrow);
    }

    pub fn approve_milestone(env: Env, escrow_id: u64, milestone_idx: u32, client: Address) {
        client.require_auth();

        let mut escrow = storage::get_escrow(&env, escrow_id).expect("escrow not found");
        if escrow.client != client {
            panic!("only client can approve milestone");
        }

        if escrow.state != EscrowState::Active {
            panic!("cannot approve milestone on disputed or completed escrow");
        }

        if milestone_idx >= escrow.milestones.len() {
            panic!("invalid milestone_idx");
        }

        let mut milestone = escrow.milestones.get(milestone_idx).unwrap();
        if milestone.status != MilestoneStatus::Submitted {
            panic!("milestone must be submitted before approval");
        }

        milestone.status = MilestoneStatus::Approved;
        escrow.milestones.set(milestone_idx, milestone);

        let release_amount = (escrow.total_amount * (milestone.basis_points as u128)) / 10000;
        escrow.amount_released += release_amount;

        // Check if all milestones are completed
        let mut all_done = true;
        for i in 0..escrow.milestones.len() {
            if escrow.milestones.get(i).unwrap().status != MilestoneStatus::Approved {
                all_done = false;
                break;
            }
        }

        if all_done {
            escrow.state = EscrowState::Completed;
        }

        storage::set_escrow(&env, &escrow);
    }

    pub fn dispute_escrow(env: Env, escrow_id: u64, caller: Address) {
        caller.require_auth();

        let mut escrow = storage::get_escrow(&env, escrow_id).expect("escrow not found");
        if caller != escrow.client && caller != escrow.contractor {
            panic!("only client or contractor can dispute escrow");
        }

        if escrow.state != EscrowState::Active {
            panic!("escrow is not active");
        }

        escrow.state = EscrowState::Disputed;
        storage::set_escrow(&env, &escrow);
    }

    pub fn resolve_dispute(
        env: Env,
        escrow_id: u64,
        arbiter: Address,
        client_share: u128,
        contractor_share: u128,
    ) {
        arbiter.require_auth();

        let mut escrow = storage::get_escrow(&env, escrow_id).expect("escrow not found");
        if escrow.arbiter != arbiter {
            panic!("unauthorized arbiter");
        }

        if escrow.state != EscrowState::Disputed {
            panic!("escrow is not in disputed state");
        }

        let remaining = escrow.total_amount - escrow.amount_released;
        if client_share + contractor_share > remaining {
            panic!("split exceeds remaining escrow balance");
        }

        escrow.amount_released += contractor_share;
        escrow.state = EscrowState::Resolved;
        storage::set_escrow(&env, &escrow);
    }

    pub fn get_escrow_status(env: Env, escrow_id: u64) -> EscrowSummary {
        storage::get_escrow(&env, escrow_id).expect("escrow not found")
    }
}

#[cfg(test)]
mod test;
