//! Stellarcade Flash Tournament Contract (experimental)
//!
//! Rapid 4-player blitz tournaments: a host opens a lobby with an entry
//! wager and a 3-minute registration window. Once exactly 4 players have
//! joined, the lobby auto-starts and is paired into 2 semifinal matches;
//! semifinal winners advance to a single final, whose winner takes 80% of
//! the prize pool (20% to the runner-up). If registration doesn't fill
//! within the window, the lobby is cancelled and every registered player
//! is refunded their entry fee in full.
//!
//! Like sibling contracts in this experimental workspace (see
//! `battle-royale-escrow`, `rental-vault`), this contract is
//! bookkeeping-only: it tracks who is owed what (prize claims, refunds)
//! but does not itself move tokens. A caller integrating this contract is
//! responsible for the actual token transfer once `claim_flash_prize` (or
//! a refund accessor) reports the amount owed.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, String, Vec};

pub use types::{FlashLobbySummary, FlashMatch, LobbyStatus};
use types::FlashLobby;

/// Registration window: 3 minutes.
pub const REGISTRATION_WINDOW_SECS: u64 = 180;

/// Winner-take-most split: 80% to the champion, 20% to the runner-up.
const CHAMPION_BPS: u128 = 8000;
const RUNNER_UP_BPS: u128 = 2000;
const BPS_DENOMINATOR: u128 = 10000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    LobbyNotFound = 1,
    LobbyNotRegistering = 2,
    LobbyFull = 3,
    AlreadyJoined = 4,
    RegistrationWindowExpired = 5,
    RegistrationWindowNotExpired = 6,
    LobbyNotCancelled = 7,
    NotAParticipant = 8,
    AlreadyRefunded = 9,
    InvalidRoundOrMatch = 10,
    MatchAlreadyDecided = 11,
    MatchNotReady = 12,
    WinnerNotInMatch = 13,
    UnauthorizedReporter = 14,
    TournamentNotComplete = 15,
    NotAWinner = 16,
    AlreadyClaimed = 17,
}

#[contract]
pub struct FlashTournament;

#[contractimpl]
impl FlashTournament {
    /// Opens a new 4-player flash lobby with a 3-minute registration
    /// window. The host is not auto-joined as a player and must call
    /// `join_lobby` separately if they wish to compete.
    pub fn create_flash_lobby(
        env: Env,
        host: Address,
        entry_fee: u128,
        game_type: String,
    ) -> Result<u64, Error> {
        host.require_auth();

        let lobby_id = storage::get_next_lobby_id(&env);
        storage::set_next_lobby_id(&env, lobby_id + 1);

        let now = env.ledger().timestamp();
        let lobby = FlashLobby {
            lobby_id,
            host,
            entry_fee,
            game_type,
            status: LobbyStatus::Registering,
            players: Vec::new(&env),
            registration_deadline: now + REGISTRATION_WINDOW_SECS,
            semifinals: Vec::new(&env),
            finals: Vec::new(&env),
            champion: None,
            runner_up: None,
            claimed: Vec::new(&env),
            refunded: Vec::new(&env),
        };

        storage::set_lobby(&env, &lobby);
        Ok(lobby_id)
    }

    /// Joins an open lobby, paying the entry wager (bookkeeping-only; see
    /// module docs). Auto-starts the tournament the moment the 4th player
    /// joins, seeding semifinal matches 1v4 and 2v3 by join order.
    pub fn join_lobby(env: Env, lobby_id: u64, player: Address) -> Result<(), Error> {
        player.require_auth();

        let mut lobby = storage::get_lobby(&env, lobby_id).ok_or(Error::LobbyNotFound)?;

        if lobby.status != LobbyStatus::Registering {
            return Err(Error::LobbyNotRegistering);
        }
        if env.ledger().timestamp() > lobby.registration_deadline {
            return Err(Error::RegistrationWindowExpired);
        }
        if lobby.players.len() >= 4 {
            return Err(Error::LobbyFull);
        }
        if lobby.players.contains(&player) {
            return Err(Error::AlreadyJoined);
        }

        lobby.players.push_back(player);

        if lobby.players.len() == 4 {
            let p1 = lobby.players.get(0).unwrap();
            let p2 = lobby.players.get(1).unwrap();
            let p3 = lobby.players.get(2).unwrap();
            let p4 = lobby.players.get(3).unwrap();

            let mut semifinals = Vec::new(&env);
            semifinals.push_back(FlashMatch {
                player_a: p1,
                player_b: p4,
                winner: None,
            });
            semifinals.push_back(FlashMatch {
                player_a: p2,
                player_b: p3,
                winner: None,
            });
            lobby.semifinals = semifinals;
            lobby.status = LobbyStatus::Semifinals;
        }

        storage::set_lobby(&env, &lobby);
        Ok(())
    }

    /// Records the winner of a semifinal (`round = 0`) or the final
    /// (`round = 1`, `match_idx` must be 0). Only the lobby host may report
    /// results. Advances semifinal winners into the final automatically,
    /// and crowns the champion/runner-up once the final is decided.
    pub fn report_match_winner(
        env: Env,
        lobby_id: u64,
        round: u32,
        match_idx: u32,
        winner: Address,
    ) -> Result<(), Error> {
        let mut lobby = storage::get_lobby(&env, lobby_id).ok_or(Error::LobbyNotFound)?;
        lobby.host.require_auth();

        match round {
            0 => {
                if lobby.status != LobbyStatus::Semifinals {
                    return Err(Error::InvalidRoundOrMatch);
                }
                if match_idx >= lobby.semifinals.len() {
                    return Err(Error::InvalidRoundOrMatch);
                }

                let mut m = lobby.semifinals.get(match_idx).unwrap();
                if m.winner.is_some() {
                    return Err(Error::MatchAlreadyDecided);
                }
                if winner != m.player_a && winner != m.player_b {
                    return Err(Error::WinnerNotInMatch);
                }

                m.winner = Some(winner);
                lobby.semifinals.set(match_idx, m);

                // Once both semifinals are decided, seed the final.
                let sf0 = lobby.semifinals.get(0).unwrap();
                let sf1 = lobby.semifinals.get(1).unwrap();
                if let (Some(w0), Some(w1)) = (sf0.winner, sf1.winner) {
                    let mut finals = Vec::new(&env);
                    finals.push_back(FlashMatch {
                        player_a: w0,
                        player_b: w1,
                        winner: None,
                    });
                    lobby.finals = finals;
                    lobby.status = LobbyStatus::Finals;
                }

                storage::set_lobby(&env, &lobby);
                Ok(())
            }
            1 => {
                if lobby.status != LobbyStatus::Finals {
                    return Err(Error::MatchNotReady);
                }
                if match_idx != 0 {
                    return Err(Error::InvalidRoundOrMatch);
                }

                if lobby.finals.is_empty() {
                    return Err(Error::MatchNotReady);
                }
                let mut m = lobby.finals.get(0).unwrap();
                if m.winner.is_some() {
                    return Err(Error::MatchAlreadyDecided);
                }
                if winner != m.player_a && winner != m.player_b {
                    return Err(Error::WinnerNotInMatch);
                }

                let runner_up = if winner == m.player_a {
                    m.player_b.clone()
                } else {
                    m.player_a.clone()
                };
                m.winner = Some(winner.clone());
                lobby.finals.set(0, m);
                lobby.champion = Some(winner);
                lobby.runner_up = Some(runner_up);
                lobby.status = LobbyStatus::Completed;

                storage::set_lobby(&env, &lobby);
                Ok(())
            }
            _ => Err(Error::InvalidRoundOrMatch),
        }
    }

    /// Cancels a lobby whose 3-minute registration window has elapsed
    /// without filling to 4 players. Anyone may call this once the
    /// deadline has passed; it only flips lobby status so
    /// `claim_flash_prize` can pay out refunds.
    pub fn cancel_expired_lobby(env: Env, lobby_id: u64) -> Result<(), Error> {
        let mut lobby = storage::get_lobby(&env, lobby_id).ok_or(Error::LobbyNotFound)?;

        if lobby.status != LobbyStatus::Registering {
            return Err(Error::LobbyNotRegistering);
        }
        if env.ledger().timestamp() <= lobby.registration_deadline {
            return Err(Error::RegistrationWindowNotExpired);
        }

        lobby.status = LobbyStatus::Cancelled;
        storage::set_lobby(&env, &lobby);
        Ok(())
    }

    /// Claims a payout for `player`: the champion/runner-up split once the
    /// tournament is `Completed`, or a full entry-fee refund once the lobby
    /// is `Cancelled`. Returns the amount owed (bookkeeping-only).
    pub fn claim_flash_prize(env: Env, lobby_id: u64, player: Address) -> Result<u128, Error> {
        player.require_auth();

        let mut lobby = storage::get_lobby(&env, lobby_id).ok_or(Error::LobbyNotFound)?;

        match lobby.status {
            LobbyStatus::Cancelled => {
                if !lobby.players.contains(&player) {
                    return Err(Error::NotAParticipant);
                }
                if lobby.refunded.contains(&player) {
                    return Err(Error::AlreadyRefunded);
                }
                lobby.refunded.push_back(player);
                storage::set_lobby(&env, &lobby);
                Ok(lobby.entry_fee)
            }
            LobbyStatus::Completed => {
                let is_champion = lobby.champion == Some(player.clone());
                let is_runner_up = lobby.runner_up == Some(player.clone());
                if !is_champion && !is_runner_up {
                    return Err(Error::NotAWinner);
                }
                if lobby.claimed.contains(&player) {
                    return Err(Error::AlreadyClaimed);
                }

                let pool = lobby.entry_fee * (lobby.players.len() as u128);
                let amount = if is_champion {
                    (pool * CHAMPION_BPS) / BPS_DENOMINATOR
                } else {
                    (pool * RUNNER_UP_BPS) / BPS_DENOMINATOR
                };

                lobby.claimed.push_back(player);
                storage::set_lobby(&env, &lobby);
                Ok(amount)
            }
            _ => Err(Error::TournamentNotComplete),
        }
    }

    /// Read-only summary of a flash lobby's current state.
    pub fn get_flash_lobby(env: Env, lobby_id: u64) -> Result<FlashLobbySummary, Error> {
        let lobby = storage::get_lobby(&env, lobby_id).ok_or(Error::LobbyNotFound)?;
        Ok(FlashLobbySummary {
            lobby_id: lobby.lobby_id,
            host: lobby.host,
            entry_fee: lobby.entry_fee,
            game_type: lobby.game_type,
            status: lobby.status,
            players: lobby.players,
            registration_deadline: lobby.registration_deadline,
            semifinals: lobby.semifinals,
            finals: lobby.finals,
            champion: lobby.champion,
            runner_up: lobby.runner_up,
        })
    }
}
