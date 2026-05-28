use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, Env,
};

fn setup(
    env: &Env,
) -> (
    CreatorEscrowClient<'_>,
    Address,
    Address,
    Address,
    Address,
) {
    let admin = Address::generate(env);
    let creator = Address::generate(env);
    let payout_token = Address::generate(env);
    let beneficiary = Address::generate(env);
    let contract_id = env.register_contract(None, CreatorEscrow);
    let client = CreatorEscrowClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, creator, payout_token, beneficiary)
}

#[test]
fn test_creator_summary_and_release_happy_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, creator, payout_token, beneficiary) = setup(&env);

    client.configure_creator(&creator, &payout_token, &beneficiary, &10);
    client.fund_escrow(&creator, &100);

    env.ledger().set_sequence_number(12);
    client.fund_escrow(&creator, &200);

    let summary_before_release = client.creator_summary(&creator);
    assert!(summary_before_release.exists);
    assert_eq!(summary_before_release.payout_token, Some(payout_token.clone()));
    assert_eq!(summary_before_release.beneficiary, Some(beneficiary.clone()));
    assert_eq!(summary_before_release.release_delay_ledgers, 10);
    assert_eq!(summary_before_release.total_locked, 300);
    assert_eq!(summary_before_release.total_released, 0);
    assert_eq!(summary_before_release.releasable_now, 100);
    assert_eq!(summary_before_release.pending_entry_count, 2);
    assert_eq!(summary_before_release.next_entry_id, 2);

    let released = client.release_available(&creator);
    assert_eq!(released, 100);

    let summary_after_release = client.creator_summary(&creator);
    assert_eq!(summary_after_release.total_locked, 300);
    assert_eq!(summary_after_release.total_released, 100);
    assert_eq!(summary_after_release.releasable_now, 0);
    assert_eq!(summary_after_release.pending_entry_count, 1);

    let first_entry = client.escrow_entry(&creator, &0);
    assert!(first_entry.exists);
    assert!(first_entry.released);

    let second_entry = client.escrow_entry(&creator, &1);
    assert!(second_entry.exists);
    assert!(!second_entry.released);
    assert!(!second_entry.releasable_now);
}

#[test]
fn test_creator_summary_unknown_creator_returns_zero_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _creator, _payout_token, _beneficiary) = setup(&env);
    let unknown_creator = Address::generate(&env);

    let summary = client.creator_summary(&unknown_creator);
    assert!(!summary.exists);
    assert_eq!(summary.payout_token, None);
    assert_eq!(summary.beneficiary, None);
    assert_eq!(summary.total_locked, 0);
    assert_eq!(summary.total_released, 0);
    assert_eq!(summary.releasable_now, 0);
    assert_eq!(summary.pending_entry_count, 0);

    let entry = client.escrow_entry(&unknown_creator, &44);
    assert!(!entry.exists);
    assert_eq!(entry.amount, 0);
}

#[test]
fn test_creator_pause_blocks_release_workflow() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, creator, payout_token, beneficiary) = setup(&env);

    client.configure_creator(&creator, &payout_token, &beneficiary, &0);
    client.fund_escrow(&creator, &250);
    client.set_creator_paused(&creator, &true);

    let summary = client.creator_summary(&creator);
    assert!(summary.paused);

    let result = client.try_release_available(&creator);
    assert_eq!(result, Err(Ok(Error::CreatorPaused)));
}
