extern crate std;

use soroban_sdk::{testutils::{Address as _, Ledger as _}, Address, Env};

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

#[test]
fn season_performance_summary_with_active_season_returns_correct_values() {
    let env = Env::default();
    env.mock_all_auths();
    // Timestamp within the season window [100, 300]
    env.ledger().with_mut(|ledger| ledger.timestamp = 200);
    let admin = Address::generate(&env);
    let id = env.register(GuildSeason, ());
    let client = GuildSeasonClient::new(&env, &id);
    client.init(&admin);
    // season_id=7, threshold=250, starts_at=100, ends_at=300, guild_count=1000
    client.set_active_season(&admin, &7, &250, &100, &300, &1000);

    let summary = client.season_performance_summary();
    assert!(summary.has_active_season);
    assert!(summary.is_active);
    assert_eq!(summary.season_id, 7);
    assert_eq!(summary.guild_count, 1000);
    assert_eq!(summary.reward_threshold, 250);
    assert_eq!(summary.starts_at, 100);
    assert_eq!(summary.ends_at, 300);
    assert_eq!(summary.now, 200);
    assert_eq!(summary.seconds_remaining, 100); // 300 - 200
}

#[test]
fn season_performance_summary_with_no_season_returns_defaults() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let id = env.register(GuildSeason, ());
    let client = GuildSeasonClient::new(&env, &id);
    client.init(&admin);

    let summary = client.season_performance_summary();
    assert!(!summary.has_active_season);
    assert!(!summary.is_active);
    assert_eq!(summary.season_id, 0);
    assert_eq!(summary.seconds_remaining, 0);
}

#[test]
fn tier_cutoff_accessor_returns_correct_bps() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let id = env.register(GuildSeason, ());
    let client = GuildSeasonClient::new(&env, &id);
    client.init(&admin);
    // threshold=250, guild_count=1000 → bps = 250 * 10_000 / 1000 = 2500
    client.set_active_season(&admin, &5, &250, &100, &500, &1000);

    let accessor = client.tier_cutoff_accessor();
    assert!(accessor.has_active_season);
    assert_eq!(accessor.season_id, 5);
    assert_eq!(accessor.reward_threshold, 250);
    assert_eq!(accessor.guild_count, 1000);
    assert_eq!(accessor.tier_cutoff_bps, 2500);
}

#[test]
fn tier_cutoff_accessor_with_zero_guild_count_returns_zero_bps() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let id = env.register(GuildSeason, ());
    let client = GuildSeasonClient::new(&env, &id);
    client.init(&admin);
    // guild_count=0 → bps must be 0 to avoid division by zero
    client.set_active_season(&admin, &3, &100, &50, &200, &0);

    let accessor = client.tier_cutoff_accessor();
    assert!(accessor.has_active_season);
    assert_eq!(accessor.tier_cutoff_bps, 0);
}
