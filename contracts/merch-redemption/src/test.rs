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
