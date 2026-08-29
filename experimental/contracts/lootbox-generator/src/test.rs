#![cfg(test)]

use soroban_sdk::{testutils::Address as _, vec, Address, BytesN, Env};

use crate::{Error, LootItem, LootboxGenerator, LootboxGeneratorClient, Rarity};

fn setup() -> (Env, LootboxGeneratorClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(LootboxGenerator, ());
    let client = LootboxGeneratorClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    (env, client, admin)
}

fn seed(env: &Env, fill: u8) -> BytesN<32> {
    BytesN::from_array(env, &[fill; 32])
}

#[test]
fn table_creation_and_weight_sum_validation() {
    let (env, client, admin) = setup();
    let items = vec![
        &env,
        LootItem {
            item_id: 1,
            weight: 7_000,
            rarity: Rarity::Common,
        },
        LootItem {
            item_id: 2,
            weight: 3_000,
            rarity: Rarity::Rare,
        },
    ];
    client.create_table(&admin, &1, &items);

    let probs = client.get_table_probabilities(&1);
    assert_eq!(probs.len(), 2);
    let sum: u32 = probs.iter().map(|p| p.probability_bps).sum();
    assert_eq!(sum, 10_000);

    let empty = vec![&env];
    let res = client.try_create_table(&admin, &2, &empty);
    assert_eq!(res, Err(Ok(Error::EmptyTable)));

    let zero = vec![
        &env,
        LootItem {
            item_id: 9,
            weight: 0,
            rarity: Rarity::Common,
        },
    ];
    let res = client.try_create_table(&admin, &3, &zero);
    assert_eq!(res, Err(Ok(Error::InvalidWeight)));
}

#[test]
fn lootbox_opening_assigns_item() {
    let (env, client, admin) = setup();
    let player = Address::generate(&env);
    let items = vec![
        &env,
        LootItem {
            item_id: 42,
            weight: 10_000,
            rarity: Rarity::Legendary,
        },
    ];
    client.create_table(&admin, &7, &items);

    let result = client.open_lootbox(&player, &7, &seed(&env, 1));
    assert_eq!(result.item_id, 42);
    assert_eq!(result.rarity, Rarity::Legendary);

    let inv = client.get_player_inventory(&player);
    assert_eq!(inv.len(), 1);
    assert_eq!(inv.get(0).unwrap().item_id, 42);
    assert_eq!(inv.get(0).unwrap().quantity, 1);

    let missing = client.try_open_lootbox(&player, &99, &seed(&env, 2));
    assert_eq!(missing, Err(Ok(Error::TableNotFound)));
}

#[test]
fn statistical_distribution_follows_weights() {
    let (env, client, admin) = setup();
    let player = Address::generate(&env);
    let items = vec![
        &env,
        LootItem {
            item_id: 1,
            weight: 8_000,
            rarity: Rarity::Common,
        },
        LootItem {
            item_id: 2,
            weight: 2_000,
            rarity: Rarity::Rare,
        },
    ];
    client.create_table(&admin, &1, &items);

    let mut common = 0u32;
    let mut rare = 0u32;
    for i in 0..80u8 {
        let result = client.open_lootbox(&player, &1, &seed(&env, i));
        if result.item_id == 1 {
            common += 1;
        } else {
            rare += 1;
        }
    }
    // 80/20 weights: common should clearly dominate over 80 rolls.
    assert!(common > rare);
    assert!(common >= 40);
}
