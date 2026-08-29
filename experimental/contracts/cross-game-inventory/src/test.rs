use soroban_sdk::{testutils::Address as _, vec, Address, Env, String};

use crate::{CrossGameInventory, CrossGameInventoryClient, Error, ItemCategory};

fn setup() -> (Env, CrossGameInventoryClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(CrossGameInventory, ());
    let client = CrossGameInventoryClient::new(&env, &contract_id);
    client.initialize(&admin);
    (env, client, admin, contract_id)
}

fn item_id(env: &Env, name: &str) -> String {
    String::from_str(env, name)
}

#[test]
fn register_and_grant_item() {
    let (env, client, admin, _) = setup();
    let player = Address::generate(&env);
    let game = Address::generate(&env);

    let games = vec![&env, game.clone()];
    client.register_item(
        &admin,
        &item_id(&env, "sword"),
        &ItemCategory::PowerUp,
        &String::from_str(&env, "ipfs://sword"),
        &games,
    );

    client.grant_item(&admin, &player, &item_id(&env, "sword"), &5);

    let items = client.get_player_items(&player);
    assert_eq!(items.len(), 1);
    assert_eq!(items.get_unchecked(0).item_id, item_id(&env, "sword"));
    assert_eq!(items.get_unchecked(0).quantity, 5);
}

#[test]
fn consume_item_decrements_quantity() {
    let (env, client, admin, _) = setup();
    let player = Address::generate(&env);
    let game = Address::generate(&env);

    let games = vec![&env, game.clone()];
    client.register_item(
        &admin,
        &item_id(&env, "shield"),
        &ItemCategory::Cosmetic,
        &String::from_str(&env, "ipfs://shield"),
        &games,
    );
    client.grant_item(&admin, &player, &item_id(&env, "shield"), &3);

    let result = client.consume_item(&game, &player, &item_id(&env, "shield"));
    assert!(result);

    let items = client.get_player_items(&player);
    assert_eq!(items.get_unchecked(0).quantity, 2);
}

#[test]
fn unauthorized_game_contract_rejected() {
    let (env, client, admin, _) = setup();
    let player = Address::generate(&env);
    let game = Address::generate(&env);
    let other_game = Address::generate(&env);

    let games = vec![&env, game];
    client.register_item(
        &admin,
        &item_id(&env, "potion"),
        &ItemCategory::PowerUp,
        &String::from_str(&env, "ipfs://potion"),
        &games,
    );
    client.grant_item(&admin, &player, &item_id(&env, "potion"), &1);

    let result = client.try_consume_item(&other_game, &player, &item_id(&env, "potion"));
    assert_eq!(result, Err(Ok(Error::NotSupportedGame)));
}

#[test]
fn consume_zero_balance_rejected() {
    let (env, client, admin, _) = setup();
    let player = Address::generate(&env);
    let game = Address::generate(&env);

    let games = vec![&env, game.clone()];
    client.register_item(
        &admin,
        &item_id(&env, "orb"),
        &ItemCategory::Badge,
        &String::from_str(&env, "ipfs://orb"),
        &games,
    );

    let result = client.try_consume_item(&game, &player, &item_id(&env, "orb"));
    assert_eq!(result, Err(Ok(Error::InsufficientBalance)));
}

#[test]
fn peer_to_peer_transfer() {
    let (env, client, admin, _) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let game = Address::generate(&env);

    let games = vec![&env, game];
    client.register_item(
        &admin,
        &item_id(&env, "gem"),
        &ItemCategory::Cosmetic,
        &String::from_str(&env, "ipfs://gem"),
        &games,
    );
    client.grant_item(&admin, &alice, &item_id(&env, "gem"), &10);

    client.transfer_item(&alice, &bob, &item_id(&env, "gem"), &4);

    let alice_items = client.get_player_items(&alice);
    assert_eq!(alice_items.get_unchecked(0).quantity, 6);

    let bob_items = client.get_player_items(&bob);
    assert_eq!(bob_items.get_unchecked(0).quantity, 4);
}

#[test]
fn transfer_insufficient_balance_rejected() {
    let (env, client, admin, _) = setup();
    let alice = Address::generate(&env);
    let bob = Address::generate(&env);
    let game = Address::generate(&env);

    let games = vec![&env, game];
    client.register_item(
        &admin,
        &item_id(&env, "coin"),
        &ItemCategory::PowerUp,
        &String::from_str(&env, "ipfs://coin"),
        &games,
    );
    client.grant_item(&admin, &alice, &item_id(&env, "coin"), &2);

    let result = client.try_transfer_item(&alice, &bob, &item_id(&env, "coin"), &5);
    assert_eq!(result, Err(Ok(Error::InsufficientBalance)));
}
