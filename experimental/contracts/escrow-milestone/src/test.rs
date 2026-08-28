#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, vec, Env, String};
use types::MilestoneStatus;

#[test]
fn test_successful_3_phase_milestone_execution() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowMilestoneContract, ());
    let client = EscrowMilestoneContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let contractor_addr = Address::generate(&env);
    let arbiter_addr = Address::generate(&env);

    let m1 = Milestone {
        description: String::from_str(&env, "Phase 1: Design"),
        basis_points: 3000,
        status: MilestoneStatus::Pending,
        proof_hash: String::from_str(&env, ""),
    };
    let m2 = Milestone {
        description: String::from_str(&env, "Phase 2: Build"),
        basis_points: 5000,
        status: MilestoneStatus::Pending,
        proof_hash: String::from_str(&env, ""),
    };
    let m3 = Milestone {
        description: String::from_str(&env, "Phase 3: Launch"),
        basis_points: 2000,
        status: MilestoneStatus::Pending,
        proof_hash: String::from_str(&env, ""),
    };

    let milestones = vec![&env, m1, m2, m3];
    let escrow_id = client.create_escrow(&client_addr, &contractor_addr, &arbiter_addr, &10_000, &milestones);

    // Submit and approve Phase 1
    client.submit_milestone(&escrow_id, &0, &String::from_str(&env, "hash1"));
    client.approve_milestone(&escrow_id, &0, &client_addr);
    let status1 = client.get_escrow_status(&escrow_id);
    assert_eq!(status1.amount_released, 3000);

    // Submit and approve Phase 2
    client.submit_milestone(&escrow_id, &1, &String::from_str(&env, "hash2"));
    client.approve_milestone(&escrow_id, &1, &client_addr);
    let status2 = client.get_escrow_status(&escrow_id);
    assert_eq!(status2.amount_released, 8000);

    // Submit and approve Phase 3
    client.submit_milestone(&escrow_id, &2, &String::from_str(&env, "hash3"));
    client.approve_milestone(&escrow_id, &2, &client_addr);
    let status3 = client.get_escrow_status(&escrow_id);
    assert_eq!(status3.amount_released, 10_000);
    assert_eq!(status3.state, EscrowState::Completed);
}

#[test]
fn test_dispute_and_arbiter_resolution() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(EscrowMilestoneContract, ());
    let client = EscrowMilestoneContractClient::new(&env, &contract_id);

    let client_addr = Address::generate(&env);
    let contractor_addr = Address::generate(&env);
    let arbiter_addr = Address::generate(&env);

    let m1 = Milestone {
        description: String::from_str(&env, "Phase 1"),
        basis_points: 10000,
        status: MilestoneStatus::Pending,
        proof_hash: String::from_str(&env, ""),
    };
    let milestones = vec![&env, m1];
    let escrow_id = client.create_escrow(&client_addr, &contractor_addr, &arbiter_addr, &10_000, &milestones);

    // Contractor raises dispute
    client.dispute_escrow(&escrow_id, &contractor_addr);
    let status = client.get_escrow_status(&escrow_id);
    assert_eq!(status.state, EscrowState::Disputed);

    // Arbiter resolves dispute: 4000 to client, 6000 to contractor
    client.resolve_dispute(&escrow_id, &arbiter_addr, &4000, &6000);
    let final_status = client.get_escrow_status(&escrow_id);
    assert_eq!(final_status.state, EscrowState::Resolved);
    assert_eq!(final_status.amount_released, 6000);
}
