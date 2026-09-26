#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    token::StellarAssetClient,
    Address, Env, Symbol,
};

fn setup(
    env: &Env,
    num_officers: u32,
    threshold: u32,
) -> (
    ClanTreasuryVaultClient<'_>,
    Address,
    Vec<Address>,
    Address,
    Address,
) {
    let leader = Address::generate(env);
    let mut officers = Vec::new(env);
    for _ in 0..num_officers {
        officers.push_back(Address::generate(env));
    }

    let token_admin = Address::generate(env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_address = token_contract_id.address();

    let contract_id = env.register(ClanTreasuryVault, ());
    let client = ClanTreasuryVaultClient::new(env, &contract_id);

    env.mock_all_auths();
    client.initialize(&leader, &officers, &threshold, &token_address);

    (client, leader, officers, token_address, contract_id)
}

fn mint(env: &Env, token_address: &Address, to: &Address, amount: i128) {
    let sac_client = StellarAssetClient::new(env, token_address);
    // Underlying asset admin isn't tracked here; StellarAssetClient::mint
    // requires admin auth which mock_all_auths satisfies in tests.
    sac_client.mint(to, &amount);
}

// ---------------------------------------------------------------------------
// 1. deposit increases vault balance
// ---------------------------------------------------------------------------

#[test]
fn test_deposit_increases_vault_balance() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _leader, _officers, token_address, _contract_id) = setup(&env, 2, 2);

    let contributor = Address::generate(&env);
    mint(&env, &token_address, &contributor, 1_000);

    client.deposit(&contributor, &400);

    assert_eq!(client.get_vault_balance(), 400);

    client.deposit(&contributor, &100);
    assert_eq!(client.get_vault_balance(), 500);
}

// ---------------------------------------------------------------------------
// 2. proposal creation, multi-officer approval, successful payout execution
// ---------------------------------------------------------------------------

#[test]
fn test_proposal_lifecycle_success() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, leader, officers, token_address, _contract_id) = setup(&env, 2, 2);

    let contributor = Address::generate(&env);
    mint(&env, &token_address, &contributor, 1_000);
    client.deposit(&contributor, &1_000);

    let recipient = Address::generate(&env);
    let memo = Symbol::new(&env, "payout");
    let proposal_id = client.create_proposal(&leader, &recipient, &300, &memo);

    // Leader's vote (leader is an officer too) counts as 1 of 2 needed.
    client.vote_proposal(&leader, &proposal_id, &true);
    // Second officer approves, reaching the 2-of-3 threshold.
    client.vote_proposal(&officers.get(0).unwrap(), &proposal_id, &true);

    // Premature execution before timelock expiry must fail.
    let early = client.try_execute_proposal(&proposal_id);
    assert!(early.is_err());

    // Advance ledger sequence past the timelock window.
    env.ledger().with_mut(|l| {
        l.sequence_number += types::EXECUTION_TIMELOCK_LEDGERS + 1;
    });

    client.execute_proposal(&proposal_id);

    assert_eq!(client.get_vault_balance(), 700);

    let proposal = client.get_proposal(&proposal_id);
    assert!(proposal.executed);

    // Re-execution must fail.
    let result = client.try_execute_proposal(&proposal_id);
    assert!(result.is_err());
}

// ---------------------------------------------------------------------------
// 3. rejection of premature execution without quorum
// ---------------------------------------------------------------------------

#[test]
fn test_execution_rejected_without_quorum() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, leader, officers, token_address, _contract_id) = setup(&env, 2, 2);

    let contributor = Address::generate(&env);
    mint(&env, &token_address, &contributor, 1_000);
    client.deposit(&contributor, &1_000);

    let recipient = Address::generate(&env);
    let memo = Symbol::new(&env, "payout");
    let proposal_id = client.create_proposal(&leader, &recipient, &300, &memo);

    // Only one approval; threshold is 2.
    client.vote_proposal(&leader, &proposal_id, &true);

    let result = client.try_execute_proposal(&proposal_id);
    assert!(result.is_err());

    // Even after advancing ledgers, quorum still isn't met.
    env.ledger().with_mut(|l| {
        l.sequence_number += types::EXECUTION_TIMELOCK_LEDGERS + 1;
    });
    let result2 = client.try_execute_proposal(&proposal_id);
    assert!(result2.is_err());

    // Non-officer vote must be rejected.
    let outsider = Address::generate(&env);
    let non_officer_result = client.try_vote_proposal(&outsider, &proposal_id, &true);
    assert!(non_officer_result.is_err());

    let _ = officers;
}

// ---------------------------------------------------------------------------
// 4. rejection of double-voting by the same officer
// ---------------------------------------------------------------------------

#[test]
fn test_double_voting_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, leader, _officers, token_address, _contract_id) = setup(&env, 2, 2);

    let contributor = Address::generate(&env);
    mint(&env, &token_address, &contributor, 1_000);
    client.deposit(&contributor, &1_000);

    let recipient = Address::generate(&env);
    let memo = Symbol::new(&env, "payout");
    let proposal_id = client.create_proposal(&leader, &recipient, &300, &memo);

    client.vote_proposal(&leader, &proposal_id, &true);

    let result = client.try_vote_proposal(&leader, &proposal_id, &true);
    assert!(result.is_err());
}
