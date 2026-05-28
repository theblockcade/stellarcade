extern crate std;

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{GuildSeason, GuildSeasonClient};

#[test]
fn active_snapshot_and_threshold_read() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(GuildSeason, ());
    let client = GuildSeasonClient::new(&env, &id);
    env.mock_all_auths();

    client.init(&admin);
    client.set_active_season(&admin, &7, &250, &100, &300, &11);
    let snap = client.active_season_snapshot();
    assert!(snap.has_active_season);
    assert_eq!(snap.season_id, 7);
    assert_eq!(client.reward_threshold(&7), 250);
}

#[test]
fn empty_snapshot_is_predictable() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(GuildSeason, ());
    let client = GuildSeasonClient::new(&env, &id);
    env.mock_all_auths();
    client.init(&admin);

    let snap = client.active_season_snapshot();
    assert!(!snap.has_active_season);
    assert_eq!(client.reward_threshold(&999), 0);
}
