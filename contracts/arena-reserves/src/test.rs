#![cfg(test)]

use soroban_sdk::{Env, Address, testutils::Address as _};
use crate::{ArenaReserves, ArenaReservesClient};

#[test]
fn test_get_pending_claim_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ArenaReserves);
    let client = ArenaReservesClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    let snapshot = client.get_pending_claim_snapshot(&user);
    assert_eq!(snapshot.pending_amount, 0);
    assert_eq!(snapshot.is_paused, true);
}

#[test]
fn test_get_reserve_allocation_snapshot_alias() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ArenaReserves);
    let client = ArenaReservesClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    let snapshot = client.get_reserve_allocation_snapshot(&user);
    assert_eq!(snapshot.pending_amount, 0);
    assert_eq!(snapshot.is_paused, true);
}

#[test]
fn test_get_rollover_pressure() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ArenaReserves);
    let client = ArenaReservesClient::new(&env, &contract_id);

    let rp = client.get_rollover_pressure();
    assert_eq!(rp.total_pressure, 0);
}

#[test]
fn test_get_buffer_pressure_alias() {
    let env = Env::default();
    let contract_id = env.register_contract(None, ArenaReserves);
    let client = ArenaReservesClient::new(&env, &contract_id);

    let rp = client.get_buffer_pressure();
    assert_eq!(rp.total_pressure, 0);
}
