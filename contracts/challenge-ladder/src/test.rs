#![cfg(test)]
use soroban_sdk::{testutils::Address as _, Address, Env};

use super::*;

#[test]
fn test_bracket_health_summary_empty() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ChallengeLadder);
    let client = ChallengeLadderClient::new(&env, &contract_id);

    let summary = client.bracket_health_summary(&1);
    assert_eq!(summary.bracket_id, 1);
    assert!(!summary.exists);
    assert_eq!(summary.player_count, 0);
    assert_eq!(summary.active_games, 0);
    assert_eq!(summary.promotion_threshold, 0);
}

#[test]
fn test_promotion_cutoff_empty() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ChallengeLadder);
    let client = ChallengeLadderClient::new(&env, &contract_id);

    let cutoff = client.promotion_cutoff(&1);
    assert_eq!(cutoff.bracket_id, 1);
    assert!(!cutoff.exists);
    assert_eq!(cutoff.cutoff_score, 0);
    assert_eq!(cutoff.cutoff_rank, 0);
    assert_eq!(cutoff.next_promotion_time, 0);
}