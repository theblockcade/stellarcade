#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, String};

#[test]
fn test_record_rating_and_tier() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(DynamicReputationContract, ());
    let client = DynamicReputationContractClient::new(&env, &contract_id);

    let game = Address::generate(&env);
    let player = Address::generate(&env);

    client.record_match_rating(&game, &player, &150, &String::from_str(&env, "Good play"));

    let summary = client.get_reputation_score(&player);
    assert_eq!(summary.raw_score, 150);
    assert_eq!(summary.tier, 2); // Trusted tier (100..300)
}

#[test]
fn test_vouch_threshold_enforcement() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(DynamicReputationContract, ());
    let client = DynamicReputationContractClient::new(&env, &contract_id);

    let game = Address::generate(&env);
    let high_rep_voucher = Address::generate(&env);
    let low_rep_voucher = Address::generate(&env);
    let target = Address::generate(&env);

    client.record_match_rating(&game, &high_rep_voucher, &300, &String::from_str(&env, "High rep"));

    // High rep voucher succeeds
    client.vouch_for_player(&high_rep_voucher, &target);
    let summary = client.get_reputation_score(&target);
    assert_eq!(summary.raw_score, 50);

    // Low rep voucher panics
    let result = std::panic::catch_unwind(|| {
        client.vouch_for_player(&low_rep_voucher, &target);
    });
    assert!(result.is_err());
}
