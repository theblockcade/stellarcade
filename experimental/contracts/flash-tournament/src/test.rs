#![cfg(test)]

use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env, String};

use crate::{Error, FlashTournament, FlashTournamentClient, LobbyStatus, REGISTRATION_WINDOW_SECS};

fn setup() -> (Env, FlashTournamentClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let host = Address::generate(&env);
    let contract_id = env.register(FlashTournament, ());
    let client = FlashTournamentClient::new(&env, &contract_id);
    (env, client, host)
}

fn game_type(env: &Env) -> String {
    String::from_str(env, "duel")
}

#[test]
fn full_flash_tournament_cycle_semifinals_finals_and_payouts() {
    let (env, client, host) = setup();
    let entry_fee: u128 = 100;
    let lobby_id = client.create_flash_lobby(&host, &entry_fee, &game_type(&env));

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let p3 = Address::generate(&env);
    let p4 = Address::generate(&env);

    client.join_lobby(&lobby_id, &p1);
    client.join_lobby(&lobby_id, &p2);
    client.join_lobby(&lobby_id, &p3);

    // Not yet auto-started with only 3 players.
    let lobby = client.get_flash_lobby(&lobby_id);
    assert_eq!(lobby.status, LobbyStatus::Registering);

    client.join_lobby(&lobby_id, &p4);

    // Auto-started: semifinals seeded 1v4, 2v3 by join order.
    let lobby = client.get_flash_lobby(&lobby_id);
    assert_eq!(lobby.status, LobbyStatus::Semifinals);
    assert_eq!(lobby.semifinals.len(), 2);
    assert_eq!(lobby.semifinals.get(0).unwrap().player_a, p1);
    assert_eq!(lobby.semifinals.get(0).unwrap().player_b, p4);
    assert_eq!(lobby.semifinals.get(1).unwrap().player_a, p2);
    assert_eq!(lobby.semifinals.get(1).unwrap().player_b, p3);

    // Semifinal winners: p1 and p2.
    client.report_match_winner(&lobby_id, &0, &0, &p1);
    let lobby = client.get_flash_lobby(&lobby_id);
    assert_eq!(lobby.status, LobbyStatus::Semifinals);
    assert!(lobby.finals.is_empty());

    client.report_match_winner(&lobby_id, &0, &1, &p2);
    let lobby = client.get_flash_lobby(&lobby_id);
    assert_eq!(lobby.status, LobbyStatus::Finals);
    let finals = lobby.finals.get(0).unwrap();
    assert_eq!(finals.player_a, p1);
    assert_eq!(finals.player_b, p2);

    // Final: p1 wins the tournament.
    client.report_match_winner(&lobby_id, &1, &0, &p1);
    let lobby = client.get_flash_lobby(&lobby_id);
    assert_eq!(lobby.status, LobbyStatus::Completed);
    assert_eq!(lobby.champion, Some(p1.clone()));
    assert_eq!(lobby.runner_up, Some(p2.clone()));

    // Payouts: pool = 400, champion gets 80% = 320, runner-up gets 20% = 80.
    let champion_prize = client.claim_flash_prize(&lobby_id, &p1);
    assert_eq!(champion_prize, 320);

    let runner_up_prize = client.claim_flash_prize(&lobby_id, &p2);
    assert_eq!(runner_up_prize, 80);

    // Non-finalists cannot claim, and double-claims are rejected.
    let result = client.try_claim_flash_prize(&lobby_id, &p3);
    assert_eq!(result, Err(Ok(Error::NotAWinner)));

    let result = client.try_claim_flash_prize(&lobby_id, &p1);
    assert_eq!(result, Err(Ok(Error::AlreadyClaimed)));
}

#[test]
fn unfulfilled_lobby_times_out_and_refunds_registered_players() {
    let (env, client, host) = setup();
    let entry_fee: u128 = 50;
    let lobby_id = client.create_flash_lobby(&host, &entry_fee, &game_type(&env));

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    client.join_lobby(&lobby_id, &p1);
    client.join_lobby(&lobby_id, &p2);

    // Cannot cancel before the registration window elapses.
    let result = client.try_cancel_expired_lobby(&lobby_id);
    assert_eq!(result, Err(Ok(Error::RegistrationWindowNotExpired)));

    // Fast-forward past the 3-minute registration window.
    env.ledger().with_mut(|l| {
        l.timestamp += REGISTRATION_WINDOW_SECS + 1;
    });

    // Joining after the deadline is rejected even if the lobby technically
    // still shows `Registering` until explicitly cancelled.
    let p3 = Address::generate(&env);
    let result = client.try_join_lobby(&lobby_id, &p3);
    assert_eq!(result, Err(Ok(Error::RegistrationWindowExpired)));

    client.cancel_expired_lobby(&lobby_id);
    let lobby = client.get_flash_lobby(&lobby_id);
    assert_eq!(lobby.status, LobbyStatus::Cancelled);

    let refund1 = client.claim_flash_prize(&lobby_id, &p1);
    assert_eq!(refund1, entry_fee);
    let refund2 = client.claim_flash_prize(&lobby_id, &p2);
    assert_eq!(refund2, entry_fee);

    // Double refund and non-participant refund are rejected.
    let result = client.try_claim_flash_prize(&lobby_id, &p1);
    assert_eq!(result, Err(Ok(Error::AlreadyRefunded)));

    let outsider = Address::generate(&env);
    let result = client.try_claim_flash_prize(&lobby_id, &outsider);
    assert_eq!(result, Err(Ok(Error::NotAParticipant)));
}

#[test]
#[should_panic]
fn report_match_winner_panics_when_reporter_is_not_the_host() {
    // Set up with mocked auths (so create/join succeed), then disable auth
    // mocking and attempt to report a result — since no real signature is
    // available for the host, host.require_auth() must panic.
    let (env, client, host) = setup();
    let entry_fee: u128 = 10;
    let lobby_id = client.create_flash_lobby(&host, &entry_fee, &game_type(&env));

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let p3 = Address::generate(&env);
    let p4 = Address::generate(&env);
    client.join_lobby(&lobby_id, &p1);
    client.join_lobby(&lobby_id, &p2);
    client.join_lobby(&lobby_id, &p3);
    client.join_lobby(&lobby_id, &p4);

    env.set_auths(&[]);
    client.report_match_winner(&lobby_id, &0, &0, &p1);
}

#[test]
fn winner_not_in_match_is_rejected() {
    let (env, client, host) = setup();
    let entry_fee: u128 = 10;
    let lobby_id = client.create_flash_lobby(&host, &entry_fee, &game_type(&env));

    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    let p3 = Address::generate(&env);
    let p4 = Address::generate(&env);
    client.join_lobby(&lobby_id, &p1);
    client.join_lobby(&lobby_id, &p2);
    client.join_lobby(&lobby_id, &p3);
    client.join_lobby(&lobby_id, &p4);

    let outsider = Address::generate(&env);
    let result = client.try_report_match_winner(&lobby_id, &0, &0, &outsider);
    assert_eq!(result, Err(Ok(Error::WinnerNotInMatch)));
}

#[test]
fn lobby_full_rejects_a_fifth_player() {
    // Once the 4th player joins, the lobby auto-starts (status flips to
    // `Semifinals`), so a 5th join is rejected via `LobbyNotRegistering`
    // rather than `LobbyFull` — `LobbyFull` guards the (unreachable in
    // practice, since auto-start fires exactly at 4) case where players
    // is already at capacity but status is still `Registering`.
    let (env, client, host) = setup();
    let lobby_id = client.create_flash_lobby(&host, &10u128, &game_type(&env));

    for _ in 0..4 {
        let p = Address::generate(&env);
        client.join_lobby(&lobby_id, &p);
    }

    let fifth = Address::generate(&env);
    let result = client.try_join_lobby(&lobby_id, &fifth);
    assert_eq!(result, Err(Ok(Error::LobbyNotRegistering)));
}

#[test]
fn cannot_cancel_a_full_lobby() {
    let (env, client, host) = setup();
    let lobby_id = client.create_flash_lobby(&host, &10u128, &game_type(&env));

    for _ in 0..4 {
        let p = Address::generate(&env);
        client.join_lobby(&lobby_id, &p);
    }

    env.ledger().with_mut(|l| {
        l.timestamp += REGISTRATION_WINDOW_SECS + 1;
    });

    let result = client.try_cancel_expired_lobby(&lobby_id);
    assert_eq!(result, Err(Ok(Error::LobbyNotRegistering)));
}
