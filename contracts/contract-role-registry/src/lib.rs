#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractevent, contractimpl, contracttype, Address, Env, Symbol, Vec};

pub use types::{AdminView, RoleStatus, RoleTargetCount, TargetRoleCount};

use storage::*;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Role(Address, Symbol),
    TargetRoles(Address),
    RoleTargets(Symbol),
}

#[contractevent(topics = ["role_assigned"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoleAssigned {
    #[topic]
    pub target: Address,
    #[topic]
    pub role: Symbol,
}

#[contractevent(topics = ["role_revoked"])]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoleRevoked {
    #[topic]
    pub target: Address,
    #[topic]
    pub role: Symbol,
}

#[contract]
pub struct ContractRoleRegistry;

#[contractimpl]
impl ContractRoleRegistry {
    pub fn init(env: Env, admin: Address) {
        if is_initialized(&env) {
            panic!("Already initialized");
        }
        set_admin(&env, &admin);
    }

    pub fn assign_role(env: Env, target: Address, role: Symbol) {
        let admin: Address = get_admin(&env).expect("Not initialized");
        admin.require_auth();

        if !has_role(&env, &target, &role) {
            set_role(&env, &target, &role);

            RoleAssigned { target, role }.publish(&env);
        }
    }

    pub fn revoke_role(env: Env, target: Address, role: Symbol) {
        let admin: Address = get_admin(&env).expect("Not initialized");
        admin.require_auth();

        if has_role(&env, &target, &role) {
            remove_role(&env, &target, &role);

            RoleRevoked { target, role }.publish(&env);
        }
    }

    pub fn has_role(env: Env, target: Address, role: Symbol) -> bool {
        has_role(&env, &target, &role)
    }

    pub fn get_admin(env: Env) -> Address {
        get_admin(&env).expect("Not initialized")
    }

    pub fn bulk_assign_role(env: Env, assignments: Vec<(Address, Symbol)>) {
        let admin: Address = get_admin(&env).expect("Not initialized");
        admin.require_auth();

        for (target, role) in assignments.iter() {
            if !has_role(&env, &target, &role) {
                set_role(&env, &target, &role);
                RoleAssigned { target, role }.publish(&env);
            }
        }
    }

    pub fn bulk_revoke_role(env: Env, revocations: Vec<(Address, Symbol)>) {
        let admin: Address = get_admin(&env).expect("Not initialized");
        admin.require_auth();

        for (target, role) in revocations.iter() {
            if has_role(&env, &target, &role) {
                remove_role(&env, &target, &role);
                RoleRevoked { target, role }.publish(&env);
            }
        }
    }

    pub fn is_initialized(env: Env) -> bool {
        is_initialized(&env)
    }

    pub fn admin_view(env: Env) -> AdminView {
        if is_initialized(&env) {
            AdminView {
                initialized: true,
                admin: Some(get_admin(&env).expect("Not initialized")),
            }
        } else {
            AdminView {
                initialized: false,
                admin: None,
            }
        }
    }

    pub fn role_status(env: Env, target: Address, role: Symbol) -> RoleStatus {
        RoleStatus {
            assigned: has_role(&env, &target, &role),
            target,
            role,
        }
    }

    pub fn get_roles_of(env: Env, target: Address) -> Vec<Symbol> {
        get_roles_of(&env, &target)
    }

    pub fn list_targets_with_role(env: Env, role: Symbol) -> Vec<Address> {
        get_targets_with_role(&env, &role)
    }

    pub fn target_role_count(env: Env, target: Address) -> u32 {
        get_roles_of(&env, &target).len()
    }

    pub fn role_target_count(env: Env, role: Symbol) -> u32 {
        get_targets_with_role(&env, &role).len()
    }
}

#[cfg(test)]
mod test;
