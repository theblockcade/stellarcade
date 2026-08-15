#![cfg(test)]

// use crate::test::{hash}; // Removed due to visibility issues
use crate::Governance;
use crate::GovernanceClient;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Bytes, BytesN, Env, String,
};

// Define a local hash helper if needed
fn local_hash(env: &Env, data: &[u8]) -> BytesN<32> {
    env.crypto().sha256(&Bytes::from_slice(env, data)).into()
}

#[test]
fn test_governance_with_custom_governance_token() {
    let env = Env::default();
    env.mock_all_auths();

    // 1. Setup Governance Token
    let token_admin = Address::generate(&env);
    let token_id = env.register(stellarcade_governance_token::GovernanceToken, ());
    let token_client = stellarcade_governance_token::GovernanceTokenClient::new(&env, &token_id);

    token_client.init(
        &token_admin,
        &String::from_str(&env, "StellarCade Governance"),
        &String::from_str(&env, "SCG"),
        &18,
    );

    // 2. Setup Governance
    let gov_admin = Address::generate(&env);
    let gov_id = env.register(Governance, ());
    let gov_client = GovernanceClient::new(&env, &gov_id);

    gov_client.init(
        &gov_admin, &token_id, &100,  // voting period
        &50,   // timelock
        &1000, // quorum (10%)
        &6000, // threshold (60%)
    );

    // 3. Distribute tokens
    let voter1 = Address::generate(&env);
    let voter2 = Address::generate(&env);
    token_client.mint(&voter1, &1000);
    token_client.mint(&voter2, &500);

    // 4. Propose
    let proposer = Address::generate(&env);
    let payload = local_hash(&env, b"action:upgrade");
    gov_client.propose(&proposer, &1u64, &payload);

    // 5. Vote
    gov_client.vote(&1u64, &voter1, &true); // 1000 votes for
    gov_client.vote(&1u64, &voter2, &false); // 500 votes against

    let proposal = gov_client.get_proposal(&1u64);
    assert_eq!(proposal.for_votes, 1000);
    assert_eq!(proposal.against_votes, 500);

    // 6. Queue
    env.ledger()
        .set_sequence_number(env.ledger().sequence() + 101);
    gov_client.queue(&1u64);
    assert_eq!(gov_client.get_proposal(&1u64).state, 4); // STATE_QUEUED

    // 7. Execute
    env.ledger()
        .set_sequence_number(env.ledger().sequence() + 51);
    gov_client.execute(&1u64, &payload);
    assert_eq!(gov_client.get_proposal(&1u64).state, 5); // STATE_EXECUTED
}
