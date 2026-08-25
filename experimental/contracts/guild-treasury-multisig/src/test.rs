#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env, Symbol, Vec};

#[test]
fn test_multisig_2_of_3_execution() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GuildTreasuryMultisigContract, ());
    let client = GuildTreasuryMultisigContractClient::new(&env, &contract_id);

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let s3 = Address::generate(&env);
    let recipient = Address::generate(&env);

    let mut signers = Vec::new(&env);
    signers.push_back(s1.clone());
    signers.push_back(s2.clone());
    signers.push_back(s3.clone());

    let threshold = 2u32;
    let timelock_sec = 100u64;

    client.init_treasury(&signers, &threshold, &timelock_sec);

    let memo = Symbol::new(&env, "payout");
    let proposal_id = client.propose_transfer(&s1, &recipient, &5000u128, &memo);
    assert_eq!(proposal_id, 1);

    let summary = client.get_proposal(&proposal_id);
    assert_eq!(summary.confirmations_count, 1);
    assert!(!summary.executed);

    // Confirm with second signer
    client.confirm_proposal(&proposal_id, &s2);
    let summary = client.get_proposal(&proposal_id);
    assert_eq!(summary.confirmations_count, 2);

    // Fast forward timelock delay
    env.ledger().with_mut(|l| l.timestamp += 150);

    // Execute proposal
    client.execute_proposal(&proposal_id, &s1);
    let summary = client.get_proposal(&proposal_id);
    assert!(summary.executed);
}

#[test]
#[should_panic(expected = "confirmation threshold not met")]
fn test_rejection_below_threshold() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GuildTreasuryMultisigContract, ());
    let client = GuildTreasuryMultisigContractClient::new(&env, &contract_id);

    let s1 = Address::generate(&env);
    let s2 = Address::generate(&env);
    let recipient = Address::generate(&env);

    let mut signers = Vec::new(&env);
    signers.push_back(s1.clone());
    signers.push_back(s2.clone());

    client.init_treasury(&signers, &2u32, &0u64);

    let memo = Symbol::new(&env, "payout");
    let proposal_id = client.propose_transfer(&s1, &recipient, &1000u128, &memo);

    // Only 1 confirmation (s1), threshold is 2 -> execute should fail
    client.execute_proposal(&proposal_id, &s1);
}

#[test]
#[should_panic(expected = "proposal already executed")]
fn test_double_execution_prevention() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(GuildTreasuryMultisigContract, ());
    let client = GuildTreasuryMultisigContractClient::new(&env, &contract_id);

    let s1 = Address::generate(&env);
    let recipient = Address::generate(&env);

    let mut signers = Vec::new(&env);
    signers.push_back(s1.clone());

    client.init_treasury(&signers, &1u32, &0u64);

    let memo = Symbol::new(&env, "payout");
    let proposal_id = client.propose_transfer(&s1, &recipient, &1000u128, &memo);

    client.execute_proposal(&proposal_id, &s1);
    // Second execution should panic
    client.execute_proposal(&proposal_id, &s1);
}
