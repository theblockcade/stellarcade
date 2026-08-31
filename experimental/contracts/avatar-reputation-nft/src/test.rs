use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{AchievementTier, AvatarReputationNft, AvatarReputationNftClient, Error};

fn setup() -> (Env, AvatarReputationNftClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(AvatarReputationNft, ());
    let client = AvatarReputationNftClient::new(&env, &contract_id);
    client.initialize(&admin);
    (env, client, admin)
}

#[test]
fn mint_avatar_and_get_traits() {
    let (env, client, _) = setup();
    let player = Address::generate(&env);

    let token_id = client.mint_avatar(&player);
    assert_eq!(token_id, 0);

    let traits = client.get_avatar_traits(&token_id);
    assert_eq!(traits.level, 1);
    assert_eq!(traits.wins, 0);
    assert_eq!(traits.tier, AchievementTier::Bronze);
}

#[test]
fn update_stats_changes_level_and_tier() {
    let (env, client, admin) = setup();
    let player = Address::generate(&env);

    let token_id = client.mint_avatar(&player);
    client.update_avatar_stats(&admin, &token_id, &10, &25);

    let traits = client.get_avatar_traits(&token_id);
    assert_eq!(traits.level, 10);
    assert_eq!(traits.wins, 25);
    assert_eq!(traits.tier, AchievementTier::Gold);
}

#[test]
fn token_uri_returns_svg_json() {
    let (env, client, _) = setup();
    let player = Address::generate(&env);

    let token_id = client.mint_avatar(&player);
    let uri = client.token_uri(&token_id);
    assert!(!uri.is_empty());
}

#[test]
fn unauthorized_stat_update_rejected() {
    let (env, client, _) = setup();
    let player = Address::generate(&env);
    let attacker = Address::generate(&env);

    let token_id = client.mint_avatar(&player);

    let result = client.try_update_avatar_stats(&attacker, &token_id, &5, &10);
    assert_eq!(result, Err(Ok(Error::NotGameAuthority)));
}

#[test]
fn tier_progression_bronze_to_neon() {
    let (env, client, admin) = setup();
    let player = Address::generate(&env);

    let token_id = client.mint_avatar(&player);
    assert_eq!(
        client.get_avatar_traits(&token_id).tier,
        AchievementTier::Bronze
    );

    client.update_avatar_stats(&admin, &token_id, &5, &0);
    assert_eq!(
        client.get_avatar_traits(&token_id).tier,
        AchievementTier::Silver
    );

    client.update_avatar_stats(&admin, &token_id, &10, &0);
    assert_eq!(
        client.get_avatar_traits(&token_id).tier,
        AchievementTier::Gold
    );

    client.update_avatar_stats(&admin, &token_id, &20, &0);
    assert_eq!(
        client.get_avatar_traits(&token_id).tier,
        AchievementTier::Neon
    );
}
