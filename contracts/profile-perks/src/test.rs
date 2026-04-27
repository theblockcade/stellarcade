#![cfg(test)]

use soroban_sdk::{testutils::Address as _, vec, Address, Env};

use super::*;
use crate::storage::{set_catalog, set_user_state};

#[test]
fn test_active_perk_summary_unconfigured_catalog() {
    let env = Env::default();
    let contract_id = env.register(ProfilePerks, ());
    let client = ProfilePerksClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    let summary = client.active_perk_summary(&user);
    assert!(!summary.configured);
    assert_eq!(summary.points, 0);
    assert_eq!(summary.active_perk_id, 0);
    assert_eq!(summary.next_perk_id, 0);
}

#[test]
fn test_active_perk_summary_and_unlock_gap_happy_path() {
    let env = Env::default();
    let contract_id = env.register(ProfilePerks, ());
    let client = ProfilePerksClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    let tiers = vec![
        &env,
        PerkTier {
            perk_id: 1,
            required_points: 100,
        },
        PerkTier {
            perk_id: 2,
            required_points: 250,
        },
        PerkTier {
            perk_id: 3,
            required_points: 500,
        },
    ];

    env.as_contract(&contract_id, || {
        set_catalog(
            &env,
            &PerkCatalog {
                is_paused: false,
                tiers,
            },
        );

        set_user_state(
            &env,
            &user,
            &UserPerkState {
                user: user.clone(),
                points: 280,
            },
        );
    });

    let summary = client.active_perk_summary(&user);
    assert!(summary.configured);
    assert!(!summary.paused);
    assert_eq!(summary.points, 280);
    assert_eq!(summary.active_perk_id, 2);
    assert_eq!(summary.next_perk_id, 3);
    assert_eq!(summary.next_perk_required_points, 500);

    let gap = client.unlock_gap(&user);
    assert!(gap.configured);
    assert_eq!(gap.next_perk_id, 3);
    assert_eq!(gap.points_to_unlock, 220);
    assert!(!gap.all_perks_unlocked);
}

#[test]
fn test_unlock_gap_all_perks_unlocked() {
    let env = Env::default();
    let contract_id = env.register(ProfilePerks, ());
    let client = ProfilePerksClient::new(&env, &contract_id);
    let user = Address::generate(&env);

    env.as_contract(&contract_id, || {
        set_catalog(
            &env,
            &PerkCatalog {
                is_paused: true,
                tiers: vec![
                    &env,
                    PerkTier {
                        perk_id: 10,
                        required_points: 10,
                    },
                    PerkTier {
                        perk_id: 20,
                        required_points: 20,
                    },
                ],
            },
        );

        set_user_state(
            &env,
            &user,
            &UserPerkState {
                user: user.clone(),
                points: 99,
            },
        );
    });

    let gap = client.unlock_gap(&user);
    assert!(gap.configured);
    assert!(gap.paused);
    assert_eq!(gap.next_perk_id, 0);
    assert_eq!(gap.points_to_unlock, 0);
    assert!(gap.all_perks_unlocked);
}
