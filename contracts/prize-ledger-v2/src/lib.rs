#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};

pub use types::{LiabilityRollupSummary, PayoutWindowAccessor, PrizeRecord};

#[contract]
pub struct PrizeLedgerV2;

#[contractimpl]
impl PrizeLedgerV2 {
    pub fn init(env: Env, admin: Address) {
        if storage::has_admin(&env) {
            panic!("Already initialized");
        }
        admin.require_auth();
        storage::set_admin(&env, &admin);
    }

    pub fn record_prize(
        env: Env,
        admin: Address,
        prize_id: u64,
        recipient: Address,
        amount: i128,
        payout_at: u64,
    ) {
        admin.require_auth();
        let stored_admin = storage::get_admin(&env).expect("Not initialized");
        assert!(admin == stored_admin, "Not admin");
        assert!(amount > 0, "Amount must be positive");

        let record = PrizeRecord {
            prize_id,
            recipient,
            amount,
            payout_at,
            paid: false,
        };

        storage::set_prize(&env, &record);
        storage::add_total_liability(&env, amount);
        storage::increment_unpaid_count(&env);

        let next = storage::get_next_prize_id(&env);
        if prize_id >= next {
            storage::set_next_prize_id(&env, prize_id + 1);
        }
    }

    pub fn mark_paid(env: Env, admin: Address, prize_id: u64) {
        admin.require_auth();
        let stored_admin = storage::get_admin(&env).expect("Not initialized");
        assert!(admin == stored_admin, "Not admin");

        let mut record = storage::get_prize(&env, prize_id).expect("Prize not found");
        assert!(!record.paid, "Already paid");

        record.paid = true;
        storage::add_total_paid(&env, record.amount);
        storage::decrement_unpaid_count(&env);
        storage::increment_paid_count(&env);
        storage::set_prize(&env, &record);
    }

    pub fn liability_rollup_summary(env: Env) -> LiabilityRollupSummary {
        let configured = storage::has_admin(&env);
        let unpaid_count = storage::get_unpaid_count(&env);
        let paid_count = storage::get_paid_count(&env);
        let total_liability = storage::get_total_liability(&env);
        let total_paid = storage::get_total_paid(&env);
        let total_prizes = unpaid_count + paid_count;

        LiabilityRollupSummary {
            configured,
            total_prizes,
            unpaid_count,
            total_liability,
            paid_count,
            total_paid,
        }
    }

    pub fn payout_window_accessor(
        env: Env,
        prize_id: u64,
        window_ledgers: u32,
    ) -> PayoutWindowAccessor {
        let now = env.ledger().timestamp();

        let Some(record) = storage::get_prize(&env, prize_id) else {
            return PayoutWindowAccessor {
                prize_id,
                exists: false,
                paid: false,
                amount: 0,
                payout_at: 0,
                window_ledgers,
                window_deadline: 0,
                in_payout_window: false,
                now,
            };
        };

        let window_deadline = record.payout_at.saturating_add(window_ledgers as u64);
        let in_payout_window = !record.paid && now >= record.payout_at && now < window_deadline;

        PayoutWindowAccessor {
            prize_id,
            exists: true,
            paid: record.paid,
            amount: record.amount,
            payout_at: record.payout_at,
            window_ledgers,
            window_deadline,
            in_payout_window,
            now,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    fn setup_env() -> (Env, PrizeLedgerV2Client<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(PrizeLedgerV2, ());
        let client = PrizeLedgerV2Client::new(&env, &id);
        (env, client)
    }

    #[test]
    fn test_liability_rollup_summary_happy_path() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(1000);

        let admin = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.init(&admin);
        client.record_prize(&admin, &1u64, &recipient, &500i128, &2000u64);
        client.record_prize(&admin, &2u64, &recipient, &300i128, &3000u64);

        let summary = client.liability_rollup_summary();
        assert!(summary.configured);
        assert_eq!(summary.total_prizes, 2);
        assert_eq!(summary.unpaid_count, 2);
        assert_eq!(summary.total_liability, 800);
        assert_eq!(summary.paid_count, 0);
        assert_eq!(summary.total_paid, 0);

        client.mark_paid(&admin, &1u64);

        let summary2 = client.liability_rollup_summary();
        assert_eq!(summary2.unpaid_count, 1);
        assert_eq!(summary2.paid_count, 1);
        assert_eq!(summary2.total_paid, 500);
    }

    #[test]
    fn test_liability_rollup_summary_unconfigured() {
        let (_env, client) = setup_env();
        let summary = client.liability_rollup_summary();
        assert!(!summary.configured);
        assert_eq!(summary.total_prizes, 0);
        assert_eq!(summary.total_liability, 0);
    }

    #[test]
    fn test_payout_window_accessor_in_window() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(2000);

        let admin = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.init(&admin);
        client.record_prize(&admin, &1u64, &recipient, &500i128, &2000u64);

        // now == payout_at, window_ledgers = 1000, deadline = 3000
        let accessor = client.payout_window_accessor(&1u64, &1000u32);
        assert!(accessor.exists);
        assert!(!accessor.paid);
        assert_eq!(accessor.payout_at, 2000);
        assert_eq!(accessor.window_deadline, 3000);
        assert!(accessor.in_payout_window);
    }

    #[test]
    fn test_payout_window_accessor_after_window() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(4000);

        let admin = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.init(&admin);
        client.record_prize(&admin, &1u64, &recipient, &500i128, &2000u64);

        // now = 4000, deadline = 3000, so outside window
        let accessor = client.payout_window_accessor(&1u64, &1000u32);
        assert!(!accessor.in_payout_window);
        assert_eq!(accessor.window_deadline, 3000);
    }

    #[test]
    fn test_payout_window_accessor_missing() {
        let (env, client) = setup_env();
        let admin = Address::generate(&env);
        client.init(&admin);

        let accessor = client.payout_window_accessor(&999u64, &500u32);
        assert!(!accessor.exists);
        assert!(!accessor.in_payout_window);
    }
}
