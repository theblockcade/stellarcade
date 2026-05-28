#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{EscrowRecord, LiabilitySummary, SettlementState, SettlementWindow};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Escrow(u64),
    NextEscrowId,
    TotalEscrowed,
    TotalSettled,
    PendingCount,
    SettledCount,
}

#[contract]
pub struct EscrowLedger;

#[contractimpl]
impl EscrowLedger {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn deposit(env: Env, escrow_id: u64, payor: Address, payee: Address, amount: i128, locked_until: u64) {
        payor.require_auth();
        assert!(amount > 0, "Amount must be positive");
        assert!(locked_until > env.ledger().timestamp(), "Lock time must be in future");

        let record = EscrowRecord {
            escrow_id,
            payor: payor.clone(),
            payee,
            amount,
            locked_until,
            settled: false,
            disputed: false,
        };

        storage::set_escrow(&env, &record);
        storage::add_total_escrowed(&env, amount);
        storage::increment_pending_count(&env);
    }

    pub fn settle(env: Env, admin: Address, escrow_id: u64) -> i128 {
        admin.require_auth();

        let mut record = storage::get_escrow(&env, escrow_id).expect("Escrow not found");
        assert!(!record.settled, "Already settled");
        assert!(!record.disputed, "Cannot settle disputed escrow");
        assert!(env.ledger().timestamp() >= record.locked_until, "Lock period not expired");

        record.settled = true;
        storage::set_escrow(&env, &record);
        storage::add_total_settled(&env, record.amount);
        storage::decrement_pending_count(&env);
        storage::increment_settled_count(&env);

        record.amount
    }

    pub fn liability_summary(env: Env) -> LiabilitySummary {
        let configured = env.storage().instance().has(&DataKey::Admin);

        LiabilitySummary {
            configured,
            total_escrowed: storage::get_total_escrowed(&env),
            total_settled: storage::get_total_settled(&env),
            total_disputed: 0i128,
            pending_count: storage::get_pending_count(&env),
            settled_count: storage::get_settled_count(&env),
        }
    }

    pub fn settlement_window(env: Env, escrow_id: u64) -> SettlementWindow {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(record) = storage::get_escrow(&env, escrow_id) else {
            return SettlementWindow {
                escrow_id,
                configured,
                exists: false,
                state: if configured {
                    SettlementState::Pending
                } else {
                    SettlementState::NotConfigured
                },
                amount: 0,
                locked_until: 0,
                now,
            };
        };

        let state = if record.disputed {
            SettlementState::Disputed
        } else if record.settled {
            SettlementState::Settled
        } else {
            SettlementState::Pending
        };

        SettlementWindow {
            escrow_id,
            configured,
            exists: true,
            state,
            amount: record.amount,
            locked_until: record.locked_until,
            now,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_init() {
        let env = Env::default();
        let admin = Address::random(&env);
        EscrowLedger::init(env.clone(), admin.clone());
    }

    #[test]
    fn test_deposit_and_settle() {
        let env = Env::default();
        env.ledger().set_timestamp(1000);

        let admin = Address::random(&env);
        let payor = Address::random(&env);
        let payee = Address::random(&env);

        EscrowLedger::init(env.clone(), admin.clone());
        EscrowLedger::deposit(
            env.clone(),
            1,
            payor.clone(),
            payee.clone(),
            1000,
            2000,
        );

        let summary = EscrowLedger::liability_summary(env.clone());
        assert_eq!(summary.total_escrowed, 1000);
        assert_eq!(summary.pending_count, 1);

        env.ledger().set_timestamp(2100);
        let settled_amount = EscrowLedger::settle(env.clone(), admin, 1);
        assert_eq!(settled_amount, 1000);

        let summary = EscrowLedger::liability_summary(env);
        assert_eq!(summary.total_settled, 1000);
        assert_eq!(summary.settled_count, 1);
    }

    #[test]
    fn test_settlement_window_missing() {
        let env = Env::default();
        let admin = Address::random(&env);
        EscrowLedger::init(env.clone(), admin);

        let window = EscrowLedger::settlement_window(env, 999);
        assert_eq!(window.exists, false);
        assert_eq!(window.configured, true);
    }
}
