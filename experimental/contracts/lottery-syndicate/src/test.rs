#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env};

#[test]
fn test_syndicate_creation_and_proportional_dividend() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LotterySyndicateContract, ());
    let client = LotterySyndicateContractClient::new(&env, &contract_id);

    let manager = Address::generate(&env);
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let lottery = Address::generate(&env);

    let syn_id = client.create_syndicate(&manager, &100, &1000, &lottery);
    assert_eq!(syn_id, 1);

    // Member 1 buys 300 shares, Member 2 buys 700 shares (total 1000)
    client.join_syndicate(&syn_id, &member1, &300);
    client.join_syndicate(&syn_id, &member2, &700);

    let (m1_shares, _) = client.get_member_shares(&syn_id, &member1);
    assert_eq!(m1_shares, 300);

    // Record prize of 10,000 tokens
    client.record_prize_winnings(&syn_id, &10_000);

    // Member 1 gets 30% = 3,000
    let div1 = client.claim_dividend(&syn_id, &member1);
    assert_eq!(div1, 3_000);

    // Member 2 gets 70% = 7,000
    let div2 = client.claim_dividend(&syn_id, &member2);
    assert_eq!(div2, 7_000);

    // Double claim fails
    let res = std::panic::catch_unwind(|| {
        client.claim_dividend(&syn_id, &member1);
    });
    assert!(res.is_err());
}
