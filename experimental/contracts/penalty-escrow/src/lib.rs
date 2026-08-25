#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, BytesN, Env};
use types::{BondStatus, BondSummary, DisputeRecord, PlayerBond};

#[contract]
pub struct PenaltyEscrowContract;

#[contractimpl]
impl PenaltyEscrowContract {
    pub fn deposit_bond(env: Env, player: Address, match_id: u64, amount: u128) {
        player.require_auth();

        if amount == 0 {
            panic!("bond deposit amount must be greater than 0");
        }

        if storage::get_bond(&env, match_id, &player).is_some() {
            panic!("bond already deposited for this match");
        }

        let bond = PlayerBond {
            match_id,
            player: player.clone(),
            amount,
            status: BondStatus::Active,
            dispute_id: None,
        };

        storage::set_bond(&env, &bond);
    }

    pub fn release_bond(env: Env, match_id: u64, player: Address) {
        player.require_auth();

        let mut bond =
            storage::get_bond(&env, match_id, &player).expect("bond record not found");

        if bond.status != BondStatus::Active {
            panic!("cannot release bond that is not active or is under dispute");
        }

        bond.status = BondStatus::Released;
        storage::set_bond(&env, &bond);
    }

    pub fn file_dispute(env: Env, match_id: u64, reporter: Address, evidence_hash: BytesN<32>) -> u64 {
        reporter.require_auth();

        let dispute_id = storage::get_next_dispute_id(&env);
        storage::set_next_dispute_id(&env, dispute_id + 1);

        let record = DisputeRecord {
            dispute_id,
            match_id,
            reporter,
            evidence_hash,
            resolved: false,
        };

        storage::set_dispute(&env, &record);
        dispute_id
    }

    pub fn resolve_slash(
        env: Env,
        match_id: u64,
        violator: Address,
        _beneficiary: Address,
        slash_bps: u32,
    ) {
        if slash_bps > 10_000 {
            panic!("slash_bps cannot exceed 10000 (100%)");
        }

        let mut bond =
            storage::get_bond(&env, match_id, &violator).expect("violator bond not found");

        if bond.status == BondStatus::Released || bond.status == BondStatus::Slashed {
            panic!("bond cannot be slashed in current state");
        }

        let _slash_amount = (bond.amount.saturating_mul(slash_bps as u128)) / 10_000;

        bond.status = BondStatus::Slashed;
        storage::set_bond(&env, &bond);
    }

    pub fn get_bond_status(env: Env, match_id: u64, player: Address) -> BondSummary {
        let bond = storage::get_bond(&env, match_id, &player).expect("bond not found");
        let is_disputed = bond.status == BondStatus::Disputed || bond.dispute_id.is_some();

        BondSummary {
            match_id: bond.match_id,
            player: bond.player,
            amount: bond.amount,
            status: bond.status,
            is_disputed,
        }
    }
}

#[cfg(test)]
mod test;
