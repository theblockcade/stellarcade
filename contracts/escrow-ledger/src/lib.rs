#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    DisputeWindowAccessor, EscrowRecord, LedgerBalanceSummary, LiabilitySummary, SettlementState,
    SettlementWindow,
};

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

    pub fn ledger_balance_summary(env: Env) -> LedgerBalanceSummary {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let total_escrowed = storage::get_total_escrowed(&env);
        let total_settled = storage::get_total_settled(&env);
        let total_disputed = 0i128;
        let net_balance = total_escrowed - total_settled;
        let dispute_exposure = total_disputed;

        LedgerBalanceSummary {
            configured,
            total_escrowed,
            total_settled,
            total_disputed,
            pending_count: storage::get_pending_count(&env),
            settled_count: storage::get_settled_count(&env),
            net_balance,
            dispute_exposure,
        }
    }

    pub fn dispute_window_accessor(
        env: Env,
        escrow_id: u64,
        dispute_window_secs: u64,
    ) -> DisputeWindowAccessor {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(record) = storage::get_escrow(&env, escrow_id) else {
            return DisputeWindowAccessor {
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
                dispute_window_secs,
                dispute_deadline: 0,
                in_dispute_window: false,
                window_remaining: 0,
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

        let dispute_deadline = record.locked_until.saturating_add(dispute_window_secs);
        let in_dispute_window = matches!(state, SettlementState::Disputed) && now < dispute_deadline;
        let window_remaining = if in_dispute_window {
            dispute_deadline - now
        } else {
            0
        };

        DisputeWindowAccessor {
            escrow_id,
            configured,
            exists: true,
            state,
            amount: record.amount,
            locked_until: record.locked_until,
            dispute_window_secs,
            dispute_deadline,
            in_dispute_window,
            window_remaining,
            now,
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

    fn setup_env() -> (Env, EscrowLedgerClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(EscrowLedger, ());
        let client = EscrowLedgerClient::new(&env, &id);
        (env, client)
    }

    #[test]
    fn test_init() {
        let (env, client) = setup_env();
        let admin = Address::generate(&env);
        client.init(&admin);
    }

    #[test]
    fn test_deposit_and_settle() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(1000);

        let admin = Address::generate(&env);
        let payor = Address::generate(&env);
        let payee = Address::generate(&env);

        client.init(&admin);
        client.deposit(&1u64, &payor, &payee, &1000i128, &2000u64);

        let summary = client.liability_summary();
        assert_eq!(summary.total_escrowed, 1000);
        assert_eq!(summary.pending_count, 1);

        env.ledger().set_timestamp(2100);
        let settled_amount = client.settle(&admin, &1u64);
        assert_eq!(settled_amount, 1000);

        let summary = client.liability_summary();
        assert_eq!(summary.total_settled, 1000);
        assert_eq!(summary.settled_count, 1);
    }

    #[test]
    fn test_settlement_window_missing() {
        let (env, client) = setup_env();
        let admin = Address::generate(&env);
        client.init(&admin);

        let window = client.settlement_window(&999u64);
        assert!(!window.exists);
        assert!(window.configured);
    }

    #[test]
    fn test_ledger_balance_summary() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(1000);

        let admin = Address::generate(&env);
        let payor = Address::generate(&env);
        let payee = Address::generate(&env);

        client.init(&admin);
        client.deposit(&1u64, &payor, &payee, &1500i128, &2000u64);

        let summary = client.ledger_balance_summary();
        assert!(summary.configured);
        assert_eq!(summary.total_escrowed, 1500);
        assert_eq!(summary.total_settled, 0);
        assert_eq!(summary.net_balance, 1500);
        assert_eq!(summary.dispute_exposure, 0);
        assert_eq!(summary.pending_count, 1);

        env.ledger().set_timestamp(2100);
        client.settle(&admin, &1u64);

        let summary2 = client.ledger_balance_summary();
        assert_eq!(summary2.total_settled, 1500);
        assert_eq!(summary2.net_balance, 0);
    }

    #[test]
    fn test_ledger_balance_summary_unconfigured() {
        let (env, client) = setup_env();
        let _ = &env;
        let summary = client.ledger_balance_summary();
        assert!(!summary.configured);
        assert_eq!(summary.net_balance, 0);
        assert_eq!(summary.dispute_exposure, 0);
    }

    #[test]
    fn test_dispute_window_accessor_missing() {
        let (env, client) = setup_env();
        let admin = Address::generate(&env);
        client.init(&admin);

        let accessor = client.dispute_window_accessor(&999u64, &3600u64);
        assert!(!accessor.exists);
        assert!(accessor.configured);
        assert!(!accessor.in_dispute_window);
        assert_eq!(accessor.dispute_deadline, 0);
        assert_eq!(accessor.window_remaining, 0);
    }

    #[test]
    fn test_dispute_window_accessor_pending_escrow() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(1000);

        let admin = Address::generate(&env);
        let payor = Address::generate(&env);
        let payee = Address::generate(&env);

        client.init(&admin);
        client.deposit(&1u64, &payor, &payee, &500i128, &2000u64);

        // Escrow is Pending (not Disputed), so in_dispute_window must be false
        let accessor = client.dispute_window_accessor(&1u64, &3600u64);
        assert!(accessor.exists);
        assert_eq!(accessor.locked_until, 2000);
        assert_eq!(accessor.dispute_deadline, 5600); // 2000 + 3600
        assert!(!accessor.in_dispute_window);
        assert_eq!(accessor.window_remaining, 0);
    }
}
