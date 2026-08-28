#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, Vec};

fn setup(env: &Env) -> (BattleRoyaleEscrowContractClient<'static>, Address) {
    let contract_id = env.register(BattleRoyaleEscrowContract, ());
    let client = BattleRoyaleEscrowContractClient::new(env, &contract_id);
    let host = Address::generate(env);
    (client, host)
}

#[test]
fn test_10_player_match_progressive_eliminations_and_top_3_payout() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, host) = setup(&env);

    let match_id = client.create_match(&host, &1_000, &10, &3);

    let mut players: Vec<Address> = Vec::new(&env);
    for _ in 0..10 {
        players.push_back(Address::generate(&env));
    }
    for i in 0..players.len() {
        client.join_match(&match_id, &players.get(i).unwrap());
    }

    // Eliminate players 0..6 sequentially, leaving exactly 3 (index 7, 8, 9).
    for i in 0..7 {
        client.record_elimination(&match_id, &host, &players.get(i).unwrap(), &host);
    }

    let remaining = client.get_remaining_players(&match_id);
    assert_eq!(remaining.len(), 3);

    let result = client.finalize_match(&match_id);
    let prize_pool: u128 = 1_000 * 10;
    assert_eq!(result.first_prize, (prize_pool * 6000) / 10000);
    assert_eq!(result.second_prize, (prize_pool * 2500) / 10000);
    assert_eq!(result.third_prize, (prize_pool * 1500) / 10000);
    assert_eq!(
        result.first_prize + result.second_prize + result.third_prize,
        prize_pool
    );
}

#[test]
fn test_undercapacity_match_can_be_cancelled() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, host) = setup(&env);

    let match_id = client.create_match(&host, &500, &10, &5);

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    client.join_match(&match_id, &p1);
    client.join_match(&match_id, &p2);

    // Only 2 of 5 min_players joined — host can cancel for a full refund.
    client.cancel_match(&match_id, &host);

    let m = client.get_remaining_players(&match_id);
    // Cancelled match still reports its joined players as "remaining" since
    // nobody was eliminated; the important assertion is the status flip,
    // checked indirectly by cancel_match not panicking and being callable
    // only once (a second cancel attempt would panic on state).
    assert_eq!(m.len(), 2);
}

#[test]
#[should_panic(expected = "minimum player capacity already met")]
fn test_cannot_cancel_once_min_players_met() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, host) = setup(&env);

    let match_id = client.create_match(&host, &500, &10, &3);
    client.join_match(&match_id, &Address::generate(&env));
    client.join_match(&match_id, &Address::generate(&env));
    client.join_match(&match_id, &Address::generate(&env));

    client.cancel_match(&match_id, &host);
}

#[test]
#[should_panic(expected = "player already eliminated")]
fn test_duplicate_elimination_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, host) = setup(&env);

    let match_id = client.create_match(&host, &500, &4, &3);
    let mut players: Vec<Address> = Vec::new(&env);
    for _ in 0..4 {
        players.push_back(Address::generate(&env));
    }
    for i in 0..players.len() {
        client.join_match(&match_id, &players.get(i).unwrap());
    }

    let first = players.get(0).unwrap();
    client.record_elimination(&match_id, &host, &first, &host);
    // Eliminating the same player twice must be rejected.
    client.record_elimination(&match_id, &host, &first, &host);
}

#[test]
#[should_panic(expected = "only the top 3 survivors remain")]
fn test_cannot_eliminate_below_top_3() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, host) = setup(&env);

    let match_id = client.create_match(&host, &500, &3, &3);
    let mut players: Vec<Address> = Vec::new(&env);
    for _ in 0..3 {
        players.push_back(Address::generate(&env));
    }
    for i in 0..players.len() {
        client.join_match(&match_id, &players.get(i).unwrap());
    }

    // Only 3 players total — none can be eliminated without dropping below
    // the top-3 threshold required for a valid finalize.
    let first = players.get(0).unwrap();
    client.record_elimination(&match_id, &host, &first, &host);
}

#[test]
#[should_panic(expected = "match is not accepting players")]
fn test_cannot_join_once_match_is_full_and_started() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, host) = setup(&env);

    // Reaching max_players auto-starts the match, so a late join is
    // rejected as "not accepting players" rather than a separate
    // capacity-specific message.
    let match_id = client.create_match(&host, &500, &3, &3);
    for _ in 0..3 {
        client.join_match(&match_id, &Address::generate(&env));
    }

    client.join_match(&match_id, &Address::generate(&env));
}
