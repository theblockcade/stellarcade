use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

struct Setup {
    env: Env,
    client: TicketRedeemerClient<'static>,
    admin: Address,
    token: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(TicketRedeemer, ());
    let client = TicketRedeemerClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token = Address::generate(&env);

    let client: TicketRedeemerClient<'static> = unsafe { core::mem::transmute(client) };

    Setup {
        env,
        client,
        admin,
        token,
    }
}

#[test]
fn test_init_and_snapshot() {
    let s = setup();
    s.client.init(&s.admin, &s.token, &100, &10);

    let snapshot = s.client.get_queue_snapshot();
    assert!(snapshot.config_initialized);
    assert_eq!(snapshot.total_entries, 0);
    assert_eq!(snapshot.pending_count, 0);
    assert_eq!(snapshot.redeemed_count, 0);
    assert_eq!(snapshot.expired_count, 0);
    assert!(!snapshot.is_paused);
    assert!(!snapshot.has_scan_window);
}

#[test]
fn test_submit_and_query() {
    let s = setup();
    s.client.init(&s.admin, &s.token, &100, &10);

    let user = Address::generate(&s.env);
    s.client.submit_ticket(&user, &0);
    s.client.submit_ticket(&user, &0);

    let snapshot = s.client.get_queue_snapshot();
    assert_eq!(snapshot.total_entries, 2);
    assert_eq!(snapshot.pending_count, 2);

    let entry = s.client.get_queue_entry(&0);
    assert!(entry.exists);
    assert_eq!(entry.ticket_id, Some(0));
    assert_eq!(entry.status, TicketStatus::Pending);
}

#[test]
fn test_redeem_and_snapshot() {
    let s = setup();
    s.client.init(&s.admin, &s.token, &100, &10);

    let user = Address::generate(&s.env);
    s.client.submit_ticket(&user, &0);
    s.client.redeem_ticket(&user, &0);

    let snapshot = s.client.get_queue_snapshot();
    assert_eq!(snapshot.pending_count, 0);
    assert_eq!(snapshot.redeemed_count, 1);

    let entry = s.client.get_queue_entry(&0);
    assert_eq!(entry.status, TicketStatus::Redeemed);
    assert!(entry.redeemed_at.is_some());
}

#[test]
fn test_scan_window_lifecycle() {
    let s = setup();
    s.client.init(&s.admin, &s.token, &100, &10);

    s.client.start_scan_window(&s.admin);
    let window = s.client.get_scan_window();
    assert!(window.is_some());
    assert!(window.unwrap().is_active);

    s.client.close_scan_window(&s.admin);
    let window = s.client.get_scan_window();
    assert!(window.is_some());
    assert!(!window.unwrap().is_active);
}

#[test]
fn test_uninitialized_reads() {
    let env = Env::default();
    let contract_id = env.register(TicketRedeemer, ());
    let client = TicketRedeemerClient::new(&env, &contract_id);

    let snapshot = client.get_queue_snapshot();
    assert!(!snapshot.config_initialized);
    assert!(snapshot.is_paused);
    assert_eq!(snapshot.total_entries, 0);

    let entry = client.get_queue_entry(&999);
    assert!(!entry.exists);

    assert!(client.get_scan_window().is_none());
    assert!(client.is_paused());
}

#[test]
fn test_paused_state_in_snapshot() {
    let s = setup();
    s.client.init(&s.admin, &s.token, &100, &10);

    s.client.set_pause(&true);
    let snapshot = s.client.get_queue_snapshot();
    assert!(snapshot.is_paused);
    assert!(s.client.is_paused());
}

#[test]
fn test_missing_entry() {
    let s = setup();
    s.client.init(&s.admin, &s.token, &100, &10);

    let entry = s.client.get_queue_entry(&999);
    assert!(!entry.exists);
    assert!(entry.ticket_id.is_none());
    assert!(entry.owner.is_none());
    assert_eq!(entry.status, TicketStatus::Pending);
}
