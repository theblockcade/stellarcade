use soroban_sdk::{Address, Env, Symbol, Vec};

use crate::DataKey;

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().instance().get(&DataKey::Admin)
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

pub fn has_role(env: &Env, target: &Address, role: &Symbol) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::Role(target.clone(), role.clone()))
}

pub fn set_role(env: &Env, target: &Address, role: &Symbol) {
    env.storage()
        .persistent()
        .set(&DataKey::Role(target.clone(), role.clone()), &());

    let mut roles: Vec<Symbol> = env
        .storage()
        .persistent()
        .get(&DataKey::TargetRoles(target.clone()))
        .unwrap_or_else(|| Vec::new(env));
    let mut found = false;
    for r in roles.iter() {
        if r == *role {
            found = true;
            break;
        }
    }
    if !found {
        roles.push_back(role.clone());
        env.storage()
            .persistent()
            .set(&DataKey::TargetRoles(target.clone()), &roles);
    }

    let mut targets: Vec<Address> = env
        .storage()
        .persistent()
        .get(&DataKey::RoleTargets(role.clone()))
        .unwrap_or_else(|| Vec::new(env));
    let mut found = false;
    for t in targets.iter() {
        if t == *target {
            found = true;
            break;
        }
    }
    if !found {
        targets.push_back(target.clone());
        env.storage()
            .persistent()
            .set(&DataKey::RoleTargets(role.clone()), &targets);
    }
}

pub fn remove_role(env: &Env, target: &Address, role: &Symbol) {
    env.storage()
        .persistent()
        .remove(&DataKey::Role(target.clone(), role.clone()));

    if let Some(roles) = env
        .storage()
        .persistent()
        .get::<_, Vec<Symbol>>(&DataKey::TargetRoles(target.clone()))
    {
        let mut new_roles = Vec::new(env);
        for r in roles.iter() {
            if r != *role {
                new_roles.push_back(r);
            }
        }
        if new_roles.is_empty() {
            env.storage()
                .persistent()
                .remove(&DataKey::TargetRoles(target.clone()));
        } else {
            env.storage()
                .persistent()
                .set(&DataKey::TargetRoles(target.clone()), &new_roles);
        }
    }

    if let Some(targets) = env
        .storage()
        .persistent()
        .get::<_, Vec<Address>>(&DataKey::RoleTargets(role.clone()))
    {
        let mut new_targets = Vec::new(env);
        for t in targets.iter() {
            if t != *target {
                new_targets.push_back(t);
            }
        }
        if new_targets.is_empty() {
            env.storage()
                .persistent()
                .remove(&DataKey::RoleTargets(role.clone()));
        } else {
            env.storage()
                .persistent()
                .set(&DataKey::RoleTargets(role.clone()), &new_targets);
        }
    }
}

pub fn get_roles_of(env: &Env, target: &Address) -> Vec<Symbol> {
    env.storage()
        .persistent()
        .get(&DataKey::TargetRoles(target.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn get_targets_with_role(env: &Env, role: &Symbol) -> Vec<Address> {
    env.storage()
        .persistent()
        .get(&DataKey::RoleTargets(role.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

pub fn is_initialized(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}
