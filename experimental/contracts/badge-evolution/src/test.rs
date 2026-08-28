#![cfg(test)]

use soroban_sdk::{testutils::Address as _, token, vec, Address, Env};

use crate::{BadgeEvolution, BadgeEvolutionClient, Error};

const FIRE_SWORD: u32 = 1;
const FIRE_SWORD_EVOLVED: u32 = 2;
const TOKEN_FEE: i128 = 500;

struct Setup {
    env: Env,
    client: BadgeEvolutionClient<'static>,
    token: token::Client<'static>,
    admin: Address,
    player: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token::Client::new(&env, &sac.address());
    token::StellarAssetClient::new(&env, &sac.address()).mint(&player, &1_000_000i128);

    let contract_id = env.register(BadgeEvolution, ());
    let client = BadgeEvolutionClient::new(&env, &contract_id);
    client.initialize(&admin, &sac.address());

    Setup { env, client, token, admin, player }
}

fn register_basic_recipe(s: &Setup, recipe_id: u64, required_burn_count: u32) {
    s.client.register_recipe(
        &s.admin,
        &recipe_id,
        &FIRE_SWORD,
        &required_burn_count,
        &FIRE_SWORD_EVOLVED,
        &2u32,
        &TOKEN_FEE,
    );
}

#[test]
fn test_evolution_with_three_duplicate_badges() {
    let s = setup();
    register_basic_recipe(&s, 1, 3);

    let id0 = s.client.mint_badge(&s.player, &FIRE_SWORD);
    let id1 = s.client.mint_badge(&s.player, &FIRE_SWORD);
    let id2 = s.client.mint_badge(&s.player, &FIRE_SWORD);

    let new_id = s.client.evolve_badge(&s.player, &1, &vec![&s.env, id0, id1, id2]);

    let evolved = s.client.get_badge(&new_id);
    assert_eq!(evolved.owner, s.player);
    assert_eq!(evolved.level, 2);
    assert_eq!(evolved.item_type, FIRE_SWORD_EVOLVED);
    assert_eq!(s.client.get_badge_level(&new_id), 2);
}

#[test]
fn test_ingredient_badges_are_burned_permanently() {
    let s = setup();
    register_basic_recipe(&s, 1, 3);

    let id0 = s.client.mint_badge(&s.player, &FIRE_SWORD);
    let id1 = s.client.mint_badge(&s.player, &FIRE_SWORD);
    let id2 = s.client.mint_badge(&s.player, &FIRE_SWORD);

    s.client.evolve_badge(&s.player, &1, &vec![&s.env, id0, id1, id2]);

    for id in [id0, id1, id2] {
        let result = s.client.try_get_badge(&id);
        assert!(result.is_err());
    }
}

#[test]
fn test_evolution_deducts_token_fee() {
    let s = setup();
    register_basic_recipe(&s, 1, 1);
    let id = s.client.mint_badge(&s.player, &FIRE_SWORD);

    let balance_before = s.token.balance(&s.player);
    s.client.evolve_badge(&s.player, &1, &vec![&s.env, id]);
    let balance_after = s.token.balance(&s.player);

    assert_eq!(balance_before - balance_after, TOKEN_FEE);
}

#[test]
fn test_evolution_fails_when_player_missing_required_ingredients() {
    let s = setup();
    register_basic_recipe(&s, 1, 3);

    // Only mint 2 of the 3 required badges.
    let id1 = s.client.mint_badge(&s.player, &FIRE_SWORD);
    let id2 = s.client.mint_badge(&s.player, &FIRE_SWORD);

    let result = s.client.try_evolve_badge(&s.player, &1, &vec![&s.env, id1, id2]);
    assert_eq!(result, Err(Ok(Error::WrongIngredientCount)));
}

#[test]
fn test_evolution_fails_when_player_does_not_own_an_ingredient() {
    let s = setup();
    register_basic_recipe(&s, 1, 1);

    let other_player = Address::generate(&s.env);
    let not_owned_id = s.client.mint_badge(&other_player, &FIRE_SWORD);

    let result = s.client.try_evolve_badge(&s.player, &1, &vec![&s.env, not_owned_id]);
    assert_eq!(result, Err(Ok(Error::NotBadgeOwner)));
}

#[test]
fn test_evolution_fails_for_wrong_item_type() {
    let s = setup();
    register_basic_recipe(&s, 1, 1);

    const ICE_SHIELD: u32 = 99;
    let wrong_type_id = s.client.mint_badge(&s.player, &ICE_SHIELD);

    let result = s.client.try_evolve_badge(&s.player, &1, &vec![&s.env, wrong_type_id]);
    assert_eq!(result, Err(Ok(Error::WrongItemType)));
}

#[test]
fn test_evolution_fails_for_unknown_recipe() {
    let s = setup();
    let id = s.client.mint_badge(&s.player, &FIRE_SWORD);

    let result = s.client.try_evolve_badge(&s.player, &999, &vec![&s.env, id]);
    assert_eq!(result, Err(Ok(Error::RecipeNotFound)));
}

#[test]
fn test_evolution_rejects_duplicate_token_id_in_ingredients() {
    let s = setup();
    register_basic_recipe(&s, 1, 2);
    let id = s.client.mint_badge(&s.player, &FIRE_SWORD);

    // Same token id supplied twice — not two distinct badges.
    let result = s.client.try_evolve_badge(&s.player, &1, &vec![&s.env, id, id]);
    assert_eq!(result, Err(Ok(Error::DuplicateIngredient)));
}

#[test]
fn test_evolution_leaves_badges_untouched_on_failure() {
    let s = setup();
    register_basic_recipe(&s, 1, 3);

    let id1 = s.client.mint_badge(&s.player, &FIRE_SWORD);
    let id2 = s.client.mint_badge(&s.player, &FIRE_SWORD);

    // Fails (wrong count) before any burning should occur.
    let _ = s.client.try_evolve_badge(&s.player, &1, &vec![&s.env, id1, id2]);

    assert_eq!(s.client.get_badge_level(&id1), 1);
    assert_eq!(s.client.get_badge_level(&id2), 1);
}

#[test]
fn test_get_recipe_returns_registered_parameters() {
    let s = setup();
    register_basic_recipe(&s, 42, 3);

    let summary = s.client.get_recipe(&42);
    assert_eq!(summary.recipe_id, 42);
    assert_eq!(summary.base_item, FIRE_SWORD);
    assert_eq!(summary.required_burn_count, 3);
    assert_eq!(summary.result_item, FIRE_SWORD_EVOLVED);
    assert_eq!(summary.result_level, 2);
    assert_eq!(summary.token_fee, TOKEN_FEE);
}

#[test]
fn test_get_recipe_fails_for_unregistered_id() {
    let s = setup();
    let result = s.client.try_get_recipe(&123);
    assert_eq!(result, Err(Ok(Error::RecipeNotFound)));
}

#[test]
fn test_register_recipe_rejects_duplicate_recipe_id() {
    let s = setup();
    register_basic_recipe(&s, 1, 3);

    let result = s.client.try_register_recipe(
        &s.admin,
        &1,
        &FIRE_SWORD,
        &1u32,
        &FIRE_SWORD_EVOLVED,
        &2u32,
        &TOKEN_FEE,
    );
    assert_eq!(result, Err(Ok(Error::RecipeAlreadyExists)));
}

#[test]
fn test_register_recipe_rejects_zero_required_burn_count() {
    let s = setup();
    let result = s.client.try_register_recipe(
        &s.admin, &1, &FIRE_SWORD, &0u32, &FIRE_SWORD_EVOLVED, &2u32, &TOKEN_FEE,
    );
    assert_eq!(result, Err(Ok(Error::InvalidRecipe)));
}

#[test]
fn test_evolve_with_zero_fee_recipe_does_not_transfer_tokens() {
    let s = setup();
    s.client.register_recipe(&s.admin, &1, &FIRE_SWORD, &1u32, &FIRE_SWORD_EVOLVED, &2u32, &0i128);
    let id = s.client.mint_badge(&s.player, &FIRE_SWORD);

    let balance_before = s.token.balance(&s.player);
    s.client.evolve_badge(&s.player, &1, &vec![&s.env, id]);
    assert_eq!(s.token.balance(&s.player), balance_before);
}
