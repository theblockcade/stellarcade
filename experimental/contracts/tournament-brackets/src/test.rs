#![cfg(test)]

use soroban_sdk::{testutils::Address as _, Address, Env};

use crate::{Error, TournamentBrackets, TournamentBracketsClient};

fn players(env: &Env, n: u32) -> soroban_sdk::Vec<Address> {
    let mut v = soroban_sdk::Vec::new(env);
    for _ in 0..n {
        v.push_back(Address::generate(env));
    }
    v
}

fn setup() -> (Env, TournamentBracketsClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(TournamentBrackets, ());
    let client = TournamentBracketsClient::new(&env, &contract_id);
    (env, client, admin)
}

#[test]
fn full_eight_player_tournament_progresses_to_champion() {
    let (env, client, admin) = setup();
    let seeds = players(&env, 8);
    let bracket_id = client.create_bracket(&admin, &seeds);

    // Round 0 (quarterfinals): traditional seeding 1v8, 2v7, 3v6, 4v5.
    let tree = client.get_bracket_tree(&bracket_id);
    assert_eq!(tree.round_count, 3); // 8 -> 4 -> 2 -> 1 (log2(8) = 3 rounds)
    let qf = tree.rounds.get(0).unwrap();
    assert_eq!(qf.get(0).unwrap().player_a, Some(seeds.get(0).unwrap()));
    assert_eq!(qf.get(0).unwrap().player_b, Some(seeds.get(7).unwrap()));
    assert_eq!(qf.get(3).unwrap().player_a, Some(seeds.get(3).unwrap()));
    assert_eq!(qf.get(3).unwrap().player_b, Some(seeds.get(4).unwrap()));

    // Quarterfinal winners: seed0, seed2, seed4, seed6 (even seeds win).
    let qf_winners = [
        seeds.get(0).unwrap(),
        seeds.get(6).unwrap(),
        seeds.get(2).unwrap(),
        seeds.get(4).unwrap(),
    ];
    for (match_idx, winner) in qf_winners.iter().enumerate() {
        client.record_match_result(&bracket_id, &0, &(match_idx as u32), winner);
    }

    // Semifinal matchups should now be populated from QF winners.
    let tree = client.get_bracket_tree(&bracket_id);
    let sf = tree.rounds.get(1).unwrap();
    assert_eq!(sf.get(0).unwrap().player_a, Some(qf_winners[0].clone()));
    assert_eq!(sf.get(0).unwrap().player_b, Some(qf_winners[1].clone()));
    assert_eq!(sf.get(1).unwrap().player_a, Some(qf_winners[2].clone()));
    assert_eq!(sf.get(1).unwrap().player_b, Some(qf_winners[3].clone()));

    // Semifinal winners.
    client.record_match_result(&bracket_id, &1, &0, &qf_winners[0]);
    client.record_match_result(&bracket_id, &1, &1, &qf_winners[3]);

    let tree = client.get_bracket_tree(&bracket_id);
    let finals = tree.rounds.get(2).unwrap();
    assert_eq!(finals.get(0).unwrap().player_a, Some(qf_winners[0].clone()));
    assert_eq!(finals.get(0).unwrap().player_b, Some(qf_winners[3].clone()));
    assert!(!tree.is_finalized);

    // Finals: crown the champion.
    client.record_match_result(&bracket_id, &2, &0, &qf_winners[0]);

    let tree = client.get_bracket_tree(&bracket_id);
    assert!(tree.is_finalized);
    assert_eq!(tree.champion, Some(qf_winners[0].clone()));
}

#[test]
fn non_power_of_two_player_count_is_rejected() {
    let (env, client, admin) = setup();
    let seeds = players(&env, 6);

    let result = client.try_create_bracket(&admin, &seeds);
    assert_eq!(result, Err(Ok(Error::InvalidPlayerCount)));
}

#[test]
#[should_panic]
fn record_match_result_panics_when_reporter_is_not_the_bracket_admin() {
    // Set up a bracket with mocked auths (so create_bracket succeeds),
    // then disable auth mocking and attempt to report a result — since no
    // real signature is available, admin.require_auth() must panic.
    let (env, client, admin) = setup();
    let seeds = players(&env, 4);
    let bracket_id = client.create_bracket(&admin, &seeds);

    env.set_auths(&[]);
    client.record_match_result(&bracket_id, &0, &0, &seeds.get(0).unwrap());
}

#[test]
fn winner_not_in_match_is_rejected() {
    let (env, client, admin) = setup();
    let seeds = players(&env, 4);
    let bracket_id = client.create_bracket(&admin, &seeds);
    let outsider = Address::generate(&env);

    let result = client.try_record_match_result(&bracket_id, &0, &0, &outsider);
    assert_eq!(result, Err(Ok(Error::WinnerNotInMatch)));
}

#[test]
fn cannot_report_a_match_before_its_players_are_decided() {
    let (env, client, admin) = setup();
    let seeds = players(&env, 4);
    let bracket_id = client.create_bracket(&admin, &seeds);

    // Round 1 (finals) has no players assigned until round 0 resolves.
    let result = client.try_record_match_result(&bracket_id, &1, &0, &seeds.get(0).unwrap());
    assert_eq!(result, Err(Ok(Error::MatchNotReady)));
}

#[test]
fn cannot_report_the_same_match_twice() {
    let (env, client, admin) = setup();
    let seeds = players(&env, 4);
    let bracket_id = client.create_bracket(&admin, &seeds);

    client.record_match_result(&bracket_id, &0, &0, &seeds.get(0).unwrap());
    let result = client.try_record_match_result(&bracket_id, &0, &0, &seeds.get(0).unwrap());
    assert_eq!(result, Err(Ok(Error::MatchAlreadyDecided)));
}

#[test]
fn active_matches_only_includes_matches_with_both_players_and_no_winner() {
    let (env, client, admin) = setup();
    let seeds = players(&env, 4);
    let bracket_id = client.create_bracket(&admin, &seeds);

    // Initially only round 0's 2 matches are active (round 1 has TBD players).
    let active = client.get_active_matches(&bracket_id);
    assert_eq!(active.len(), 2);

    client.record_match_result(&bracket_id, &0, &0, &seeds.get(0).unwrap());
    client.record_match_result(&bracket_id, &0, &1, &seeds.get(2).unwrap());

    // Now the finals match is populated and active, and round 0 has no
    // more active matches (both decided).
    let active = client.get_active_matches(&bracket_id);
    assert_eq!(active.len(), 1);
    assert_eq!(active.get(0).unwrap().round_idx, 1);
}
