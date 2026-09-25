use soroban_sdk::{test, Address, BytesN, Duration, Symbol, Vec};
use soroban_sdk::token::{Client as TokenClient, Token};
use soroban_sdk::token::TokenType;
use crate::{BountyEscrow, Error};

#[test]
fn test_post_bounty() {
    let env = test::Env::default();
    let contract_id = env.register_contract(None, BountyEscrow);
    let sponsor = Address::generate(&env);
    let target_game = Symbol::from_utf8(&env, "arcade-game").unwrap();
    
    // Fund sponsor
    TokenClient::new(&env, &contract_id).mint(&sponsor, &1000);
    
    // Post bounty
    BountyEscrow::post_bounty(
        &env,
        sponsor,
        target_game,
        1000,
        100,
        Duration::from_seconds(&env, 3600),
    ).unwrap();
}

#[test]
fn test_approve_bounty() {
    let env = test::Env::default();
    let contract_id = env.register_contract(None, BountyEscrow);
    let sponsor = Address::generate(&env);
    let verifier = Address::generate(&env);
    let target_game = Symbol::from_utf8(&env, "arcade-game").unwrap();
    
    // Fund sponsor
    TokenClient::new(&env, &contract_id).mint(&sponsor, &1000);
    
    // Post bounty
    let bounty_id = env.call_contract("hash", vec![], &[]);
    BountyEscrow::post_bounty(
        &env,
        sponsor,
        target_game,
        1000,
        100,
        Duration::from_seconds(&env, 3600),
    ).unwrap();
    
    // Approve bounty
    BountyEscrow::approve_bounty(&env, verifier, bounty_id).unwrap();
}

#[test]
fn test_expired_bounty_refund() {
    let env = test::Env::default();
    let contract_id = env.register_contract(None, BountyEscrow);
    let sponsor = Address::generate(&env);
    let target_game = Symbol::from_utf8(&env, "arcade-game").unwrap();
    
    // Fund sponsor
    TokenClient::new(&env, &contract_id).mint(&sponsor, &1000);
    
    // Post bounty with expired deadline
    let bounty_id = env.call_contract("hash", vec![], &[]);
    BountyEscrow::post_bounty(
        &env,
        sponsor,
        target_game,
        1000,
        100,
        Duration::from_seconds(&env, 0), // Expired
    ).unwrap();
    
    // Check refund
    let balance = TokenClient::new(&env, &contract_id).balance(&sponsor);
    assert_eq!(balance, 1000);
}
