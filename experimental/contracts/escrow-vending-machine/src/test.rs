#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_single_purchase_decrements_inventory() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowVendingMachineContract, ());
    let client = EscrowVendingMachineContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.list_item(&merchant, &1, &100, &10, &5);

    let receipt = client.purchase_item(&buyer, &1, &1);
    assert_eq!(receipt.quantity_dispensed, 1);
    assert_eq!(receipt.amount_charged, 100);
    assert_eq!(receipt.amount_refunded, 0);

    let inventory = client.get_item_inventory(&1);
    assert_eq!(inventory.remaining_stock, 9);
}

#[test]
fn test_batch_purchase_decrements_inventory() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowVendingMachineContract, ());
    let client = EscrowVendingMachineContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.list_item(&merchant, &1, &50, &20, &10);

    let receipt = client.purchase_item(&buyer, &1, &4);
    assert_eq!(receipt.quantity_dispensed, 4);
    assert_eq!(receipt.amount_charged, 200);

    let inventory = client.get_item_inventory(&1);
    assert_eq!(inventory.remaining_stock, 16);
}

#[test]
fn test_purchase_beyond_remaining_stock_is_auto_refunded_not_overcharged() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowVendingMachineContract, ());
    let client = EscrowVendingMachineContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let buyer = Address::generate(&env);

    // Only 1 unit of stock, but request 3 — simulates a race where stock ran
    // out mid-flight. The buyer should only be charged for what shipped.
    client.list_item(&merchant, &1, &100, &1, &10);

    let receipt = client.purchase_item(&buyer, &1, &3);
    assert_eq!(receipt.quantity_requested, 3);
    assert_eq!(receipt.quantity_dispensed, 1);
    assert_eq!(receipt.amount_charged, 100);
    assert_eq!(receipt.amount_refunded, 200);

    let inventory = client.get_item_inventory(&1);
    assert_eq!(inventory.remaining_stock, 0);
}

#[test]
#[should_panic(expected = "no units available")]
fn test_purchase_on_out_of_stock_item_reverts() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowVendingMachineContract, ());
    let client = EscrowVendingMachineContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.list_item(&merchant, &1, &100, &1, &10);
    client.purchase_item(&buyer, &1, &1);

    // Second buyer attempts to purchase from now-empty stock.
    let second_buyer = Address::generate(&env);
    client.purchase_item(&second_buyer, &1, &1);
}

#[test]
fn test_max_purchase_limit_per_user_partially_fills_remaining_allowance() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowVendingMachineContract, ());
    let client = EscrowVendingMachineContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.list_item(&merchant, &1, &100, &50, &3);

    let first = client.purchase_item(&buyer, &1, &2);
    assert_eq!(first.quantity_dispensed, 2);

    // Buyer requests 2 more but only 1 unit of allowance remains — only that
    // 1 unit is charged, the rest of the request is auto-refunded.
    let second = client.purchase_item(&buyer, &1, &2);
    assert_eq!(second.quantity_dispensed, 1);
    assert_eq!(second.amount_charged, 100);
    assert_eq!(second.amount_refunded, 100);
}

#[test]
#[should_panic(expected = "no units available")]
fn test_purchase_fully_blocked_once_user_limit_reached() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowVendingMachineContract, ());
    let client = EscrowVendingMachineContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.list_item(&merchant, &1, &100, &50, &2);
    client.purchase_item(&buyer, &1, &2);

    // Fully exhausted allowance — must panic, not silently no-op.
    client.purchase_item(&buyer, &1, &1);
}

#[test]
fn test_restock_increases_available_inventory() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowVendingMachineContract, ());
    let client = EscrowVendingMachineContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.list_item(&merchant, &1, &100, &1, &10);
    client.purchase_item(&buyer, &1, &1);

    let before = client.get_item_inventory(&1);
    assert_eq!(before.remaining_stock, 0);

    client.restock_item(&merchant, &1, &5);

    let after = client.get_item_inventory(&1);
    assert_eq!(after.remaining_stock, 5);
    assert_eq!(after.total_stock, 6);
}

#[test]
fn test_withdraw_revenue_transfers_only_settled_earnings() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowVendingMachineContract, ());
    let client = EscrowVendingMachineContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.list_item(&merchant, &1, &100, &10, &10);
    client.purchase_item(&buyer, &1, &3);

    let withdrawn = client.withdraw_revenue(&merchant, &1);
    assert_eq!(withdrawn, 300);

    // Revenue is reset after withdrawal — a second withdrawal yields nothing.
    let second_withdrawal = client.withdraw_revenue(&merchant, &1);
    assert_eq!(second_withdrawal, 0);
}

#[test]
#[should_panic(expected = "only the listing merchant")]
fn test_non_merchant_cannot_withdraw_revenue() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowVendingMachineContract, ());
    let client = EscrowVendingMachineContractClient::new(&env, &contract_id);

    let merchant = Address::generate(&env);
    let impostor = Address::generate(&env);

    client.list_item(&merchant, &1, &100, &10, &10);
    client.withdraw_revenue(&impostor, &1);
}
