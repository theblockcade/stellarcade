use super::*;
use soroban_sdk::{testutils::Address as _, vec, Env, Symbol};

// ── Original queue-mutation tests ────────────────────────────────

#[test]
fn test_enqueue_and_create_match() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let queue_id = Symbol::new(&env, "ranked");
    let crit = Symbol::new(&env, "1v1");

    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);

    client.init(&admin);
    client.enqueue_player(&queue_id, &p1, &crit);
    client.enqueue_player(&queue_id, &p2, &crit);

    let state = client.queue_state(&queue_id);
    assert_eq!(state.players.len(), 2);

    let players = vec![&env, p1.clone(), p2.clone()];
    let match_id = client.create_match(&queue_id, &players);
    assert_eq!(match_id, 0);

    // Queue should be empty now
    let state = client.queue_state(&queue_id);
    assert_eq!(state.players.len(), 0);
}

#[test]
#[should_panic(expected = "Player already in queue")]
fn test_duplicate_enqueue_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let queue_id = Symbol::new(&env, "ranked");
    let crit = Symbol::new(&env, "1v1");

    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);
    client.enqueue_player(&queue_id, &p1, &crit);
    client.enqueue_player(&queue_id, &p1, &crit);
}

#[test]
fn test_dequeue_player() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let queue_id = Symbol::new(&env, "casual");
    let crit = Symbol::new(&env, "2v2");

    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);
    client.enqueue_player(&queue_id, &p1, &crit);
    client.dequeue_player(&p1, &queue_id, &p1);

    let state = client.queue_state(&queue_id);
    assert_eq!(state.players.len(), 0);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_double_init_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);
    client.init(&admin);
}

#[test]
fn test_queue_depth_and_missing_player_snapshot_for_empty_queue() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let missing_player = Address::generate(&env);
    let queue_id = Symbol::new(&env, "empty");
    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);

    client.init(&admin);

    assert_eq!(client.queue_depth(&queue_id), 0);
    assert_eq!(
        client.player_position_snapshot(&queue_id, &missing_player),
        None
    );
}

#[test]
fn test_player_position_snapshot_tracks_queue_changes() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let p3 = Address::generate(&env);
    let queue_id = Symbol::new(&env, "ranked");
    let crit = Symbol::new(&env, "solo");

    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);

    client.init(&admin);
    client.enqueue_player(&queue_id, &p1, &crit);
    client.enqueue_player(&queue_id, &p2, &crit);
    client.enqueue_player(&queue_id, &p3, &crit);

    assert_eq!(client.queue_depth(&queue_id), 3);

    let snapshot = client
        .player_position_snapshot(&queue_id, &p2)
        .expect("player should be present");
    assert_eq!(snapshot.position, 2);
    assert_eq!(snapshot.queue_depth, 3);
    assert_eq!(snapshot.criteria_hash, crit);

    client.dequeue_player(&p1, &queue_id, &p1);

    let after_dequeue = client
        .player_position_snapshot(&queue_id, &p2)
        .expect("player should still be present");
    assert_eq!(after_dequeue.position, 1);
    assert_eq!(after_dequeue.queue_depth, 2);

    let matched_players = vec![&env, p2.clone()];
    client.create_match(&queue_id, &matched_players);

    assert_eq!(client.queue_depth(&queue_id), 1);
    assert_eq!(client.player_position_snapshot(&queue_id, &p2), None);

    let remaining = client
        .player_position_snapshot(&queue_id, &p3)
        .expect("remaining player should be present");
    assert_eq!(remaining.position, 1);
    assert_eq!(remaining.queue_depth, 1);
}

// ── Queue health snapshot tests ───────────────────────────────────

#[test]
fn test_health_snapshot_empty_queue() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let queue_id = Symbol::new(&env, "ranked");
    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);

    let snap = client.queue_health_snapshot(&queue_id);
    assert_eq!(snap.queue_size, 0);
    assert_eq!(snap.active_buckets, 0);
    assert_eq!(snap.matches_total, 0);
}

#[test]
fn test_health_snapshot_active_queue() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let queue_id = Symbol::new(&env, "ranked");
    let crit = Symbol::new(&env, "1v1");
    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);

    client.enqueue_player(&queue_id, &p1, &crit);
    client.enqueue_player(&queue_id, &p2, &crit);

    let snap = client.queue_health_snapshot(&queue_id);
    assert_eq!(snap.queue_size, 2);
    assert_eq!(snap.active_buckets, 1);
    assert_eq!(snap.matches_total, 0);

    // Create a match and verify matches_total increments
    let players = vec![&env, p1.clone(), p2.clone()];
    client.create_match(&queue_id, &players);

    let snap2 = client.queue_health_snapshot(&queue_id);
    assert_eq!(snap2.queue_size, 0);
    assert_eq!(snap2.active_buckets, 0);
    assert_eq!(snap2.matches_total, 1);
}

#[test]
fn test_health_snapshot_throughput_accumulates() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let queue_id = Symbol::new(&env, "speed");
    let crit = Symbol::new(&env, "fast");
    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);

    // Create three separate matches and verify counter accumulates
    for _ in 0..3u32 {
        let p = Address::generate(&env);
        client.enqueue_player(&queue_id, &p, &crit);
        let players = vec![&env, p.clone()];
        client.create_match(&queue_id, &players);
    }

    let snap = client.queue_health_snapshot(&queue_id);
    assert_eq!(snap.matches_total, 3);
}

// ── Wait-band estimate tests ──────────────────────────────────────

#[test]
fn test_wait_band_unknown_for_empty_queue_no_history() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let queue_id = Symbol::new(&env, "fresh");
    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);

    let est = client.wait_band_estimate(&queue_id);
    assert_eq!(est.wait_band, WaitBand::Unknown);
    assert!(!est.has_history);
    assert_eq!(est.queue_size, 0);
}

#[test]
fn test_wait_band_long_for_empty_queue_with_history() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let queue_id = Symbol::new(&env, "ranked");
    let crit = Symbol::new(&env, "solo");
    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);

    client.enqueue_player(&queue_id, &p1, &crit);
    let players = vec![&env, p1.clone()];
    client.create_match(&queue_id, &players);

    let est = client.wait_band_estimate(&queue_id);
    assert_eq!(est.wait_band, WaitBand::Long);
    assert!(est.has_history);
    assert_eq!(est.queue_size, 0);
}

#[test]
fn test_wait_band_short_for_single_player() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let queue_id = Symbol::new(&env, "solo");
    let crit = Symbol::new(&env, "any");
    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);

    client.enqueue_player(&queue_id, &p1, &crit);

    let est = client.wait_band_estimate(&queue_id);
    assert_eq!(est.wait_band, WaitBand::Short);
    assert_eq!(est.queue_size, 1);
}

#[test]
fn test_wait_band_immediate_for_two_or_more_players() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let queue_id = Symbol::new(&env, "duo");
    let crit = Symbol::new(&env, "any");
    let contract_id = env.register_contract(None, MatchmakingQueue);
    let client = MatchmakingQueueClient::new(&env, &contract_id);
    client.init(&admin);

    client.enqueue_player(&queue_id, &p1, &crit);
    client.enqueue_player(&queue_id, &p2, &crit);

    let est = client.wait_band_estimate(&queue_id);
    assert_eq!(est.wait_band, WaitBand::Immediate);
    assert_eq!(est.queue_size, 2);
}
