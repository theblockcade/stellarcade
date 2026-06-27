#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{symbol_short, Env};

#[test]
fn test_init_and_admin() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    assert_eq!(client.get_admin(), admin);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_already_initialized() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    client.init(&admin);
}

#[test]
fn test_role_assignment() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    assert_eq!(client.has_role(&target, &role), false);

    client.assign_role(&target, &role);
    assert_eq!(client.has_role(&target, &role), true);

    client.revoke_role(&target, &role);
    assert_eq!(client.has_role(&target, &role), false);
}

#[test]
#[should_panic]
fn test_unauthorized_assignment() {
    let env = Env::default();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    client.assign_role(&target, &role);
}

#[test]
fn test_bulk_role_assignment() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target1 = Address::generate(&env);
    let target2 = Address::generate(&env);
    let role1 = symbol_short!("GAME");
    let role2 = symbol_short!("ADMIN");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let mut assignments = soroban_sdk::Vec::new(&env);
    assignments.push_back((target1.clone(), role1.clone()));
    assignments.push_back((target2.clone(), role2.clone()));

    assert_eq!(client.has_role(&target1, &role1), false);
    assert_eq!(client.has_role(&target2, &role2), false);

    client.bulk_assign_role(&assignments);

    assert_eq!(client.has_role(&target1, &role1), true);
    assert_eq!(client.has_role(&target2, &role2), true);

    client.bulk_revoke_role(&assignments);

    assert_eq!(client.has_role(&target1, &role1), false);
    assert_eq!(client.has_role(&target2, &role2), false);
}

#[test]
#[should_panic]
fn test_unauthorized_bulk_assignment() {
    let env = Env::default();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let mut assignments = soroban_sdk::Vec::new(&env);
    assignments.push_back((target, role));

    client.bulk_assign_role(&assignments);
}

#[test]
fn test_is_initialized_returns_false_before_init() {
    let env = Env::default();
    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    assert_eq!(client.is_initialized(), false);
}

#[test]
fn test_is_initialized_returns_true_after_init() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    assert_eq!(client.is_initialized(), true);
}

#[test]
fn test_admin_view_success_path() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let view = client.admin_view();
    assert_eq!(view.initialized, true);
    assert_eq!(view.admin.unwrap(), admin);
}

#[test]
fn test_admin_view_empty_state() {
    let env = Env::default();
    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    let view = client.admin_view();
    assert_eq!(view.initialized, false);
    assert!(view.admin.is_none());
}

#[test]
fn test_role_status_assigned() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    client.assign_role(&target, &role);

    let status = client.role_status(&target, &role);
    assert_eq!(status.assigned, true);
    assert_eq!(status.target, target);
    assert_eq!(status.role, role);
}

#[test]
fn test_role_status_not_assigned() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let status = client.role_status(&target, &role);
    assert_eq!(status.assigned, false);
}

#[test]
fn test_get_roles_of_multiple_roles() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role1 = symbol_short!("GAME");
    let role2 = symbol_short!("ADMIN");
    let role3 = symbol_short!("PAUSER");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    client.assign_role(&target, &role1);
    client.assign_role(&target, &role2);
    client.assign_role(&target, &role3);

    let roles = client.get_roles_of(&target);
    assert_eq!(roles.len(), 3);
}

#[test]
fn test_get_roles_of_no_roles() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let roles = client.get_roles_of(&target);
    assert_eq!(roles.len(), 0);
}

#[test]
fn test_list_targets_with_role_success() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target1 = Address::generate(&env);
    let target2 = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    client.assign_role(&target1, &role);
    client.assign_role(&target2, &role);

    let targets = client.list_targets_with_role(&role);
    assert_eq!(targets.len(), 2);
}

#[test]
fn test_list_targets_with_role_none_assigned() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let targets = client.list_targets_with_role(&role);
    assert_eq!(targets.len(), 0);
}

#[test]
fn test_target_role_count() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role1 = symbol_short!("GAME");
    let role2 = symbol_short!("ADMIN");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    client.assign_role(&target, &role1);
    client.assign_role(&target, &role2);

    let count = client.target_role_count(&target);
    assert_eq!(count, 2);
}

#[test]
fn test_target_role_count_zero() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let count = client.target_role_count(&target);
    assert_eq!(count, 0);
}

#[test]
fn test_role_target_count() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target1 = Address::generate(&env);
    let target2 = Address::generate(&env);
    let target3 = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    client.assign_role(&target1, &role);
    client.assign_role(&target2, &role);
    client.assign_role(&target3, &role);

    let count = client.role_target_count(&role);
    assert_eq!(count, 3);
}

#[test]
fn test_role_target_count_zero() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);

    let count = client.role_target_count(&role);
    assert_eq!(count, 0);
}

#[test]
fn test_revoke_updates_list_targets() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let target = Address::generate(&env);
    let role = symbol_short!("GAME");

    let contract_id = env.register(ContractRoleRegistry, ());
    let client = ContractRoleRegistryClient::new(&env, &contract_id);

    client.init(&admin);
    client.assign_role(&target, &role);
    assert_eq!(client.list_targets_with_role(&role).len(), 1);

    client.revoke_role(&target, &role);
    assert_eq!(client.list_targets_with_role(&role).len(), 0);
    assert_eq!(client.get_roles_of(&target).len(), 0);
}
