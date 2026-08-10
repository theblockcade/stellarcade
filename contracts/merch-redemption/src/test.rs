#![cfg(test)]

use soroban_sdk::{testutils::Ledger as _, Env, Symbol};

use super::*;
use crate::storage::set_claim_window;

#[test]
fn test_claim_window_snapshot_empty_state() {
    let env = Env::default();
    let contract_id = env.register(MerchRedemption, ());
    let client = MerchRedemptionClient::new(&env, &contract_id);
    let item_id = Symbol::new(&env, "hoodie");

    let snapshot = client.claim_window_snapshot(&item_id);
    assert_eq!(snapshot.item_id, item_id);
    assert!(!snapshot.configured);
    assert!(!snapshot.is_active);
    assert_eq!(snapshot.total_available, 0);
    assert_eq!(snapshot.claimed_count, 0);
    assert_eq!(snapshot.remaining_stock, 0);
}

#[test]
fn test_claim_window_snapshot_and_stock_pressure_happy_path() {
    let env = Env::default();
    env.ledger().set_timestamp(150);
    let contract_id = env.register(MerchRedemption, ());
    let client = MerchRedemptionClient::new(&env, &contract_id);
    let item_id = Symbol::new(&env, "hoodie");

    env.as_contract(&contract_id, || {
        set_claim_window(
            &env,
            &item_id,
            &ClaimWindowState {
                start_time: 100,
                end_time: 200,
                total_available: 100,
                claimed_count: 74,
            },
        );
    });

    let snapshot = client.claim_window_snapshot(&item_id);
    assert!(snapshot.configured);
    assert!(snapshot.is_active);
    assert_eq!(snapshot.remaining_stock, 26);

    let pressure = client.stock_pressure(&item_id);
    assert!(pressure.configured);
    assert!(pressure.claim_window_open);
    assert_eq!(pressure.remaining_stock, 26);
    assert_eq!(pressure.pressure_bps, 7_400);
    assert_eq!(pressure.pressure_level, StockPressureLevel::Medium);
}

#[test]
fn test_stock_pressure_empty_state() {
    let env = Env::default();
    let contract_id = env.register(MerchRedemption, ());
    let client = MerchRedemptionClient::new(&env, &contract_id);
    let item_id = Symbol::new(&env, "unknown");

    let pressure = client.stock_pressure(&item_id);
    assert!(!pressure.configured);
    assert!(!pressure.claim_window_open);
    assert_eq!(pressure.total_available, 0);
    assert_eq!(pressure.claimed_count, 0);
    assert_eq!(pressure.remaining_stock, 0);
    assert_eq!(pressure.pressure_bps, 0);
    assert_eq!(pressure.pressure_level, StockPressureLevel::None);
}

#[test]
fn test_redemption_count_summary_stock_warning_levels() {
    let env = Env::default();
    env.ledger().set_timestamp(500);
    let contract_id = env.register(MerchRedemption, ());
    let client = MerchRedemptionClient::new(&env, &contract_id);

    let tshirt = Symbol::new(&env, "tshirt");
    let cap = Symbol::new(&env, "cap");

    // High pressure: 92/100 claimed.
    env.as_contract(&contract_id, || {
        set_claim_window(
            &env,
            &tshirt,
            &ClaimWindowState {
                start_time: 400,
                end_time: 600,
                total_available: 100,
                claimed_count: 92,
            },
        );
    });
    let pressure_high = client.stock_pressure(&tshirt);
    assert_eq!(pressure_high.pressure_level, StockPressureLevel::High);
    assert_eq!(pressure_high.remaining_stock, 8);

    // No pressure: 10/100 claimed.
    env.as_contract(&contract_id, || {
        set_claim_window(
            &env,
            &cap,
            &ClaimWindowState {
                start_time: 400,
                end_time: 600,
                total_available: 100,
                claimed_count: 10,
            },
        );
    });
    let pressure_none = client.stock_pressure(&cap);
    assert_eq!(pressure_none.pressure_level, StockPressureLevel::None);
    assert_eq!(pressure_none.remaining_stock, 90);
}

#[test]
fn test_claim_window_inactive_before_start_and_after_end() {
    let env = Env::default();
    let contract_id = env.register(MerchRedemption, ());
    let client = MerchRedemptionClient::new(&env, &contract_id);
    let item_id = Symbol::new(&env, "poster");

    env.as_contract(&contract_id, || {
        set_claim_window(
            &env,
            &item_id,
            &ClaimWindowState {
                start_time: 1000,
                end_time: 2000,
                total_available: 50,
                claimed_count: 0,
            },
        );
    });

    // Before window opens.
    env.ledger().set_timestamp(500);
    let before = client.claim_window_snapshot(&item_id);
    assert!(before.configured);
    assert!(!before.is_active);

    // After window closes.
    env.ledger().set_timestamp(2001);
    let after = client.claim_window_snapshot(&item_id);
    assert!(after.configured);
    assert!(!after.is_active);
}
