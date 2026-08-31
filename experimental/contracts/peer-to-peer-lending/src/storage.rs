//! Storage keys and access helpers for the peer-to-peer lending contract.

use soroban_sdk::{contracttype, Env};

use crate::types::Loan;

/// Extend persistent entries roughly 30 days (assuming ~5s ledgers).
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextLoanId,
    Loan(u64),
}

fn extend(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, PERSISTENT_BUMP_LEDGERS, PERSISTENT_BUMP_LEDGERS);
}

pub fn get_next_loan_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextLoanId)
        .unwrap_or(1u64)
}

pub fn set_next_loan_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextLoanId, &id);
}

pub fn get_loan(env: &Env, loan_id: u64) -> Option<Loan> {
    env.storage().persistent().get(&DataKey::Loan(loan_id))
}

pub fn set_loan(env: &Env, loan: &Loan) {
    let key = DataKey::Loan(loan.loan_id);
    env.storage().persistent().set(&key, loan);
    extend(env, &key);
}
