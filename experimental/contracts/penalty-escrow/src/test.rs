#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, BytesN, Env};
use types::BondStatus;

#[test]
fn test_deposit_and_release() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(PenaltyEscrowContract, ());
    let client = PenaltyEscrowContractClient::new(&env, &contract_id);

    let player = Address::generate(&env);
    let match_id = 101u64;
    let amount = 500u128;

    client.deposit_bond(&player, &match_id, &amount);

    let status = client.get_bond_status(&match_id, &player);
    assert_eq!(status.status, BondStatus::Active);
    assert_eq!(status.amount, 500);

    client.release_bond(&match_id, &player);

    let status = client.get_bond_status(&match_id, &player);
    assert_eq!(status.status, BondStatus::Released);
}

#[test]
fn test_dispute_and_slash() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(PenaltyEscrowContract, ());
    let client = PenaltyEscrowContractClient::new(&env, &contract_id);

    let violator = Address::generate(&env);
    let victim = Address::generate(&env);
    let reporter = Address::generate(&env);
    let match_id = 102u64;
    let evidence_hash = BytesN::from_array(&env, &[9u8; 32]);

    client.deposit_bond(&violator, &match_id, &1000u128);
    let dispute_id = client.file_dispute(&match_id, &reporter, &evidence_hash);
    assert_eq!(dispute_id, 1);

    // Slash 50% (5000 bps)
    client.resolve_slash(&match_id, &violator, &victim, &5000u32);

    let status = client.get_bond_status(&match_id, &violator);
    assert_eq!(status.status, BondStatus::Slashed);
}
