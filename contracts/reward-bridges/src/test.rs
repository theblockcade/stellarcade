extern crate std;

use soroban_sdk::{testutils::Address as _, vec, Address, Env};

use crate::{BridgeEntry, RewardBridges, RewardBridgesClient};

fn setup() -> (Env, Address, soroban_sdk::Address, RewardBridgesClient<'static>) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(RewardBridges, ());
    let client = RewardBridgesClient::new(&env, &id);
    env.mock_all_auths();
    client.init(&admin);
    (env, admin, id, client)
}

#[test]
fn bridge_queue_summary_success_path() {
    let (env, admin, _id, client) = setup();
    let entries = vec![
        &env,
        BridgeEntry { entry_id: 1, amount: 500, settled: false, queued_at: 0, settle_after: 100 },
        BridgeEntry { entry_id: 2, amount: 300, settled: false, queued_at: 0, settle_after: 200 },
    ];
    client.enqueue(&admin, &entries);
    client.settle(&1);

    let summary = client.bridge_queue_summary();
    assert_eq!(summary.total_entries, 2);
    assert_eq!(summary.pending_count, 1);
    assert_eq!(summary.settled_count, 1);
    assert_eq!(summary.total_pending_amount, 300);
}

#[test]
fn bridge_queue_summary_empty_state() {
    let (_env, _admin, _id, client) = setup();
    let summary = client.bridge_queue_summary();
    assert_eq!(summary.total_entries, 0);
    assert_eq!(summary.pending_count, 0);
    assert_eq!(summary.total_pending_amount, 0);
}

#[test]
fn settlement_gap_with_pending_entries() {
    let (env, admin, _id, client) = setup();
    // ledger timestamp is 0; settle_after=500 → 500s gap
    let entries = vec![
        &env,
        BridgeEntry { entry_id: 10, amount: 100, settled: false, queued_at: 0, settle_after: 500 },
        BridgeEntry { entry_id: 11, amount: 200, settled: false, queued_at: 0, settle_after: 800 },
    ];
    client.enqueue(&admin, &entries);

    let gap = client.settlement_gap();
    assert!(gap.has_pending);
    assert_eq!(gap.next_entry_id, 10);
    assert_eq!(gap.seconds_until_next_settlement, 500);
}

#[test]
fn settlement_gap_no_pending() {
    let (_env, _admin, _id, client) = setup();
    let gap = client.settlement_gap();
    assert!(!gap.has_pending);
    assert_eq!(gap.seconds_until_next_settlement, 0);
    assert_eq!(gap.next_entry_id, 0);
}
