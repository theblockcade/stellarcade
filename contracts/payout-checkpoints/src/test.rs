#![cfg(test)]

use soroban_sdk::{Env, Address, testutils::Address as _};
use crate::{PayoutCheckpoints, PayoutCheckpointsClient};

#[test]
fn test_get_pending_claim_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PayoutCheckpoints);
    let client = PayoutCheckpointsClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    let snapshot = client.get_pending_claim_snapshot(&user);
    assert_eq!(snapshot.pending_amount, 0);
    assert_eq!(snapshot.is_paused, true);
}

#[test]
fn test_get_rollover_pressure() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PayoutCheckpoints);
    let client = PayoutCheckpointsClient::new(&env, &contract_id);

    let rp = client.get_rollover_pressure();
    assert_eq!(rp.total_pressure, 0);
}
