#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, symbol_short};

fn setup_contract() -> (Env, Address, Address, Address) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let wallet1 = Address::generate(&env);
    let wallet2 = Address::generate(&env);
    
    WalletReserves::init(env.clone(), admin.clone()).unwrap();
    
    (env, admin, wallet1, wallet2)
}

#[test]
fn test_complete_reserve_allocation_flow() {
    let (env, admin, wallet1, wallet2) = setup_contract();
    
    // Allocate reserves to multiple wallets
    WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet1.clone(), 1000, 100).unwrap();
    WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet2.clone(), 2000, 200).unwrap();
    
    // Get summary
    let summary = WalletReserves::get_reserve_allocation_summary(env.clone()).unwrap();
    assert_eq!(summary.total_allocated, 3000);
    
    // Check individual allocations
    let allocation1 = WalletReserves::get_wallet_reserves(env.clone(), wallet1.clone()).unwrap();
    assert_eq!(allocation1.allocated_amount, 1000);
    assert_eq!(allocation1.depletion_threshold, 100);
    
    let allocation2 = WalletReserves::get_wallet_reserves(env.clone(), wallet2.clone()).unwrap();
    assert_eq!(allocation2.allocated_amount, 2000);
    assert_eq!(allocation2.depletion_threshold, 200);
}

#[test]
fn test_depletion_risk_assessment_scenarios() {
    let (env, admin, wallet1, _) = setup_contract();
    
    // Test high risk scenario (below threshold)
    WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet1.clone(), 1000, 100).unwrap();
    WalletReserves::update_available_reserves(env.clone(), admin.clone(), wallet1.clone(), 50).unwrap();
    
    let risk = WalletReserves::get_depletion_risk_assessment(env.clone(), wallet1.clone()).unwrap();
    assert_eq!(risk.risk_level, symbol_short!("HIGH"));
    assert_eq!(risk.recommended_action, symbol_short!("URGENT"));
    assert_eq!(risk.current_balance, 50);
    
    // Test medium risk scenario (between threshold and 2x threshold)
    WalletReserves::update_available_reserves(env.clone(), admin.clone(), wallet1.clone(), 150).unwrap();
    
    let risk = WalletReserves::get_depletion_risk_assessment(env.clone(), wallet1.clone()).unwrap();
    assert_eq!(risk.risk_level, symbol_short!("MEDIUM"));
    assert_eq!(risk.recommended_action, symbol_short!("MONITOR"));
    
    // Test low risk scenario (above 2x threshold)
    WalletReserves::update_available_reserves(env.clone(), admin.clone(), wallet1.clone(), 300).unwrap();
    
    let risk = WalletReserves::get_depletion_risk_assessment(env.clone(), wallet1.clone()).unwrap();
    assert_eq!(risk.risk_level, symbol_short!("LOW"));
    assert_eq!(risk.recommended_action, symbol_short!("NORMAL"));
}

#[test]
fn test_empty_state_handling() {
    let (env, _, wallet1, _) = setup_contract();
    
    // Test getting summary with no allocations
    let summary = WalletReserves::get_reserve_allocation_summary(env.clone()).unwrap();
    assert_eq!(summary.total_allocated, 0);
    assert_eq!(summary.total_available, 0);
    assert_eq!(summary.total_wallets, 0);
    
    // Test getting non-existent wallet reserves
    let result = WalletReserves::get_wallet_reserves(env.clone(), wallet1.clone());
    assert_eq!(result, Err(Error::WalletNotFound));
    
    // Test getting risk assessment for non-existent wallet
    let result = WalletReserves::get_depletion_risk_assessment(env, wallet1);
    assert_eq!(result, Err(Error::WalletNotFound));
}

#[test]
fn test_paused_state_behavior() {
    let (env, admin, wallet1, _) = setup_contract();
    
    // Pause the contract
    WalletReserves::pause(env.clone(), admin.clone()).unwrap();
    
    // Test that mutations are blocked when paused
    let result = WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet1.clone(), 1000, 100);
    assert_eq!(result, Err(Error::Paused));
    
    let result = WalletReserves::update_available_reserves(env.clone(), admin.clone(), wallet1.clone(), 500);
    assert_eq!(result, Err(Error::Paused));
    
    // Test that reads still work when paused
    let summary = WalletReserves::get_reserve_allocation_summary(env.clone());
    assert!(summary.is_ok());
    
    // Unpause and test that mutations work again
    WalletReserves::unpause(env.clone(), admin.clone()).unwrap();
    let result = WalletReserves::allocate_reserves(env, admin, wallet1, 1000, 100);
    assert!(result.is_ok());
}

#[test]
fn test_authorization_enforcement() {
    let (env, admin, wallet1, _) = setup_contract();
    let unauthorized = Address::generate(&env);
    
    // Test unauthorized allocation
    let result = WalletReserves::allocate_reserves(env.clone(), unauthorized.clone(), wallet1.clone(), 1000, 100);
    assert_eq!(result, Err(Error::Unauthorized));
    
    // Test unauthorized update
    let result = WalletReserves::update_available_reserves(env.clone(), unauthorized.clone(), wallet1.clone(), 500);
    assert_eq!(result, Err(Error::Unauthorized));
    
    // Test unauthorized pause
    let result = WalletReserves::pause(env.clone(), unauthorized.clone());
    assert_eq!(result, Err(Error::Unauthorized));
    
    // Test that admin can perform operations
    let result = WalletReserves::allocate_reserves(env, admin, wallet1, 1000, 100);
    assert!(result.is_ok());
}

#[test]
fn test_invalid_amount_handling() {
    let (env, admin, wallet1, _) = setup_contract();
    
    // Test zero allocation amount
    let result = WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet1.clone(), 0, 100);
    assert_eq!(result, Err(Error::InvalidAmount));
    
    // Test negative allocation amount
    let result = WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet1.clone(), -100, 100);
    assert_eq!(result, Err(Error::InvalidAmount));
    
    // Test zero threshold
    let result = WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet1.clone(), 1000, 0);
    assert_eq!(result, Err(Error::InvalidAmount));
    
    // Test negative threshold
    let result = WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet1.clone(), 1000, -50);
    assert_eq!(result, Err(Error::InvalidAmount));
    
    // Test negative available amount update
    WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet1.clone(), 1000, 100).unwrap();
    let result = WalletReserves::update_available_reserves(env, admin, wallet1, -100);
    assert_eq!(result, Err(Error::InvalidAmount));
}

#[test]
fn test_contract_not_initialized() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let wallet = Address::generate(&env);
    
    // Test operations on uninitialized contract
    let result = WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet.clone(), 1000, 100);
    assert_eq!(result, Err(Error::NotInitialized));
    
    let result = WalletReserves::get_reserve_allocation_summary(env.clone());
    assert_eq!(result, Err(Error::NotInitialized));
    
    let result = WalletReserves::get_depletion_risk_assessment(env, wallet);
    assert_eq!(result, Err(Error::NotInitialized));
}

#[test]
fn test_reserve_update_flow() {
    let (env, admin, wallet1, _) = setup_contract();
    
    // Initial allocation
    WalletReserves::allocate_reserves(env.clone(), admin.clone(), wallet1.clone(), 1000, 100).unwrap();
    
    let initial = WalletReserves::get_wallet_reserves(env.clone(), wallet1.clone()).unwrap();
    assert_eq!(initial.available_amount, 1000);
    
    // Update available reserves (simulate usage)
    WalletReserves::update_available_reserves(env.clone(), admin.clone(), wallet1.clone(), 750).unwrap();
    
    let updated = WalletReserves::get_wallet_reserves(env.clone(), wallet1.clone()).unwrap();
    assert_eq!(updated.available_amount, 750);
    assert!(updated.last_updated > initial.last_updated);
    
    // Verify risk assessment reflects the change
    let risk = WalletReserves::get_depletion_risk_assessment(env, wallet1).unwrap();
    assert_eq!(risk.current_balance, 750);
}