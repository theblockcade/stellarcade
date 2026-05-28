use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    Address, Env, String,
};

fn setup_client(env: &Env) -> (EscrowMarketplaceClient<'_>, Address, Address, Address) {
    let admin = Address::generate(env);
    let buyer = Address::generate(env);
    let seller = Address::generate(env);
    let contract_id = env.register_contract(None, EscrowMarketplace);
    let client = EscrowMarketplaceClient::new(env, &contract_id);
    client.init(&admin);
    (client, admin, buyer, seller)
}

#[test]
fn test_pending_snapshot_and_blocker() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|ledger| ledger.timestamp = 100);
    let (client, _admin, buyer, seller) = setup_client(&env);

    let escrow_id = client.create_escrow(&buyer, &seller, &250, &300);
    let snapshot = client.escrow_status_snapshot(&escrow_id);
    assert_eq!(snapshot.state, EscrowViewState::Locked);

    let readiness = client.release_readiness(&escrow_id);
    assert!(!readiness.ready);
    assert_eq!(
        readiness.blocker,
        Some(String::from_str(&env, "not_expired"))
    );
}

#[test]
fn test_releasable_snapshot_after_expiry() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, buyer, seller) = setup_client(&env);

    let escrow_id = client.create_escrow(&buyer, &seller, &250, &300);
    env.ledger().with_mut(|ledger| ledger.timestamp = 305);

    let snapshot = client.escrow_status_snapshot(&escrow_id);
    assert_eq!(snapshot.state, EscrowViewState::Releasable);

    let readiness = client.release_readiness(&escrow_id);
    assert!(readiness.ready);
    assert_eq!(readiness.blocker, None);
}

#[test]
fn test_expired_after_admin_recovery() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, buyer, seller) = setup_client(&env);

    let escrow_id = client.create_escrow(&buyer, &seller, &250, &300);
    env.ledger().with_mut(|ledger| ledger.timestamp = 350);
    client.expire_escrow(&escrow_id);

    let snapshot = client.escrow_status_snapshot(&escrow_id);
    assert_eq!(snapshot.state, EscrowViewState::Expired);

    let before = client.escrow_status_snapshot(&escrow_id);
    let _ = client.release_readiness(&escrow_id);
    let after = client.escrow_status_snapshot(&escrow_id);
    assert_eq!(before, after);
}

#[test]
fn test_disputed_escrow_reports_blocker() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, buyer, seller) = setup_client(&env);

    let escrow_id = client.create_escrow(&buyer, &seller, &250, &300);
    client.raise_dispute(&buyer, &escrow_id);

    let snapshot = client.escrow_status_snapshot(&escrow_id);
    assert_eq!(snapshot.state, EscrowViewState::Disputed);
    assert!(snapshot.dispute_open);

    let readiness = client.release_readiness(&escrow_id);
    assert!(!readiness.ready);
    assert_eq!(readiness.blocker, Some(String::from_str(&env, "disputed")));
}

#[test]
fn test_missing_escrow_returns_empty_state() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin, _buyer, _seller) = setup_client(&env);

    let snapshot = client.escrow_status_snapshot(&404);
    assert!(!snapshot.exists);
    assert_eq!(snapshot.state, EscrowViewState::Missing);

    let readiness = client.release_readiness(&404);
    assert!(!readiness.exists);
    assert_eq!(readiness.blocker, Some(String::from_str(&env, "missing")));
}
