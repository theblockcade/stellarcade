#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

pub use types::{
    EscrowLifecycleState, EscrowRecord, EscrowStatusSnapshot, EscrowViewState, ReleaseReadiness,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    NextId,
    Escrow(u64),
}

#[contract]
pub struct EscrowMarketplace;

#[contractimpl]
impl EscrowMarketplace {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextId, &0u64);
    }

    pub fn create_escrow(
        env: Env,
        buyer: Address,
        seller: Address,
        amount: i128,
        expiry: u64,
    ) -> u64 {
        buyer.require_auth();
        assert!(amount > 0, "Amount must be positive");

        let escrow_id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap_or(0);
        env.storage().instance().set(
            &DataKey::NextId,
            &escrow_id.checked_add(1).expect("Overflow"),
        );

        let record = EscrowRecord {
            escrow_id,
            buyer,
            seller,
            amount,
            expiry,
            dispute_open: false,
            status: EscrowLifecycleState::Locked,
        };

        storage::set_escrow(&env, escrow_id, &record);
        escrow_id
    }

    pub fn raise_dispute(env: Env, caller: Address, escrow_id: u64) {
        caller.require_auth();
        let mut record = storage::get_escrow(&env, escrow_id).expect("Escrow not found");
        assert!(
            caller == record.buyer || caller == record.seller,
            "Unauthorized"
        );
        record.dispute_open = true;
        storage::set_escrow(&env, escrow_id, &record);
    }

    pub fn release_escrow(env: Env, caller: Address, escrow_id: u64) {
        caller.require_auth();
        let mut record = storage::get_escrow(&env, escrow_id).expect("Escrow not found");
        assert!(caller == record.buyer, "Unauthorized");
        assert!(!record.dispute_open, "Escrow disputed");
        assert!(
            env.ledger().timestamp() >= record.expiry,
            "Escrow not ready"
        );
        record.status = EscrowLifecycleState::Released;
        storage::set_escrow(&env, escrow_id, &record);
    }

    pub fn expire_escrow(env: Env, escrow_id: u64) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();
        let mut record = storage::get_escrow(&env, escrow_id).expect("Escrow not found");
        assert!(
            env.ledger().timestamp() >= record.expiry,
            "Escrow not expired"
        );
        record.status = EscrowLifecycleState::Cancelled;
        storage::set_escrow(&env, escrow_id, &record);
    }

    pub fn escrow_status_snapshot(env: Env, escrow_id: u64) -> EscrowStatusSnapshot {
        let now = env.ledger().timestamp();
        if let Some(record) = storage::get_escrow(&env, escrow_id) {
            EscrowStatusSnapshot {
                escrow_id,
                exists: true,
                state: derive_view_state(&record, now),
                buyer: Some(record.buyer),
                seller: Some(record.seller),
                expiry: Some(record.expiry),
                dispute_open: record.dispute_open,
                now,
            }
        } else {
            EscrowStatusSnapshot {
                escrow_id,
                exists: false,
                state: EscrowViewState::Missing,
                buyer: None,
                seller: None,
                expiry: None,
                dispute_open: false,
                now,
            }
        }
    }

    pub fn release_readiness(env: Env, escrow_id: u64) -> ReleaseReadiness {
        let now = env.ledger().timestamp();
        if let Some(record) = storage::get_escrow(&env, escrow_id) {
            let state = derive_view_state(&record, now);
            let blocker = match state {
                EscrowViewState::Releasable => None,
                EscrowViewState::Disputed => Some(String::from_str(&env, "disputed")),
                EscrowViewState::Released => Some(String::from_str(&env, "released")),
                EscrowViewState::Expired => Some(String::from_str(&env, "expired")),
                EscrowViewState::Locked => Some(String::from_str(&env, "not_expired")),
                EscrowViewState::Missing => Some(String::from_str(&env, "missing")),
            };

            ReleaseReadiness {
                escrow_id,
                exists: true,
                ready: state == EscrowViewState::Releasable,
                state,
                blocker,
                now,
                expires_at: Some(record.expiry),
                dispute_open: record.dispute_open,
            }
        } else {
            ReleaseReadiness {
                escrow_id,
                exists: false,
                ready: false,
                state: EscrowViewState::Missing,
                blocker: Some(String::from_str(&env, "missing")),
                now,
                expires_at: None,
                dispute_open: false,
            }
        }
    }
}

fn derive_view_state(record: &EscrowRecord, now: u64) -> EscrowViewState {
    if record.dispute_open {
        return EscrowViewState::Disputed;
    }

    match record.status {
        EscrowLifecycleState::Released => EscrowViewState::Released,
        EscrowLifecycleState::Cancelled => EscrowViewState::Expired,
        EscrowLifecycleState::Locked if now >= record.expiry => EscrowViewState::Releasable,
        EscrowLifecycleState::Locked => EscrowViewState::Locked,
    }
}

#[cfg(test)]
mod test;
