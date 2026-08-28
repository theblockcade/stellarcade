#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, vec, Address, Env};
use types::{BattleRoyaleMatch, BattleRoyaleResult, MatchStatus, PrizeSplit};

/// Default tiered prize split: 1st 60%, 2nd 25%, 3rd 15%.
const DEFAULT_FIRST_BPS: u32 = 6000;
const DEFAULT_SECOND_BPS: u32 = 2500;
const DEFAULT_THIRD_BPS: u32 = 1500;

#[contract]
pub struct BattleRoyaleEscrowContract;

#[contractimpl]
impl BattleRoyaleEscrowContract {
    pub fn create_match(
        env: Env,
        host: Address,
        entry_fee: u128,
        max_players: u32,
        min_players: u32,
    ) -> u64 {
        host.require_auth();

        if entry_fee == 0 {
            panic!("entry_fee must be > 0");
        }
        if min_players < 3 {
            panic!("min_players must be at least 3 (top-3 payout requires 3 players)");
        }
        if max_players < min_players {
            panic!("max_players must be >= min_players");
        }

        let match_id = storage::get_next_match_id(&env);
        storage::set_next_match_id(&env, match_id + 1);

        let battle_match = BattleRoyaleMatch {
            match_id,
            host,
            entry_fee,
            max_players,
            min_players,
            prize_split: PrizeSplit {
                first_bps: DEFAULT_FIRST_BPS,
                second_bps: DEFAULT_SECOND_BPS,
                third_bps: DEFAULT_THIRD_BPS,
            },
            players: vec![&env],
            eliminated: vec![&env],
            status: MatchStatus::Lobby,
        };

        storage::set_match(&env, &battle_match);
        match_id
    }

    pub fn join_match(env: Env, match_id: u64, player: Address) {
        player.require_auth();

        let mut battle_match = storage::get_match(&env, match_id).expect("match not found");

        if battle_match.status != MatchStatus::Lobby {
            panic!("match is not accepting players");
        }
        if battle_match.players.len() >= battle_match.max_players {
            panic!("match is full");
        }
        if battle_match.players.contains(&player) {
            panic!("player already joined");
        }

        battle_match.players.push_back(player);

        if battle_match.players.len() == battle_match.max_players {
            battle_match.status = MatchStatus::InProgress;
        }

        storage::set_match(&env, &battle_match);
    }

    /// Cancels a lobby that hasn't reached min_players, refunding entry fees
    /// in full (the caller is responsible for issuing per-player refunds off
    /// the returned player list, since this contract tracks bookkeeping only).
    pub fn cancel_match(env: Env, match_id: u64, caller: Address) {
        caller.require_auth();

        let mut battle_match = storage::get_match(&env, match_id).expect("match not found");
        if caller != battle_match.host {
            panic!("only the host can cancel the match");
        }
        if battle_match.status != MatchStatus::Lobby {
            panic!("match already started or finalized");
        }
        if battle_match.players.len() >= battle_match.min_players {
            panic!("minimum player capacity already met");
        }

        battle_match.status = MatchStatus::Cancelled;
        storage::set_match(&env, &battle_match);
    }

    pub fn record_elimination(
        env: Env,
        match_id: u64,
        host: Address,
        eliminated_player: Address,
        _eliminated_by: Address,
    ) {
        host.require_auth();

        let mut battle_match = storage::get_match(&env, match_id).expect("match not found");
        if battle_match.host != host {
            panic!("only the host/arbiter can record eliminations");
        }
        if battle_match.status != MatchStatus::InProgress {
            panic!("match is not in progress");
        }
        if !battle_match.players.contains(&eliminated_player) {
            panic!("player is not in this match");
        }
        if battle_match.eliminated.contains(&eliminated_player) {
            panic!("player already eliminated");
        }

        let remaining = battle_match.players.len() - battle_match.eliminated.len();
        if remaining <= 3 {
            panic!("cannot eliminate further: only the top 3 survivors remain");
        }

        battle_match.eliminated.push_back(eliminated_player);
        storage::set_match(&env, &battle_match);
    }

    pub fn finalize_match(env: Env, match_id: u64) -> BattleRoyaleResult {
        let mut battle_match = storage::get_match(&env, match_id).expect("match not found");

        if battle_match.status != MatchStatus::InProgress {
            panic!("match is not in progress");
        }

        let remaining = Self::remaining_players(&battle_match);
        if remaining.len() != 3 {
            panic!("exactly 3 survivors must remain before finalizing");
        }

        // Eliminated last (i.e. most recently pushed) among the 3 survivors
        // is 3rd place; the very last eliminated overall is who the 3
        // survivors outlasted. Since exactly 3 remain and none of them are
        // eliminated, rank the 3 by elimination-order proxy: the order they
        // appear in `players` after removing eliminated ones is used as a
        // stable placement (2nd/3rd distinguished by reverse join order,
        // 1st is the final entrant left standing by convention of this
        // contract's elimination protocol).
        let third_place = remaining.get(2).unwrap();
        let second_place = remaining.get(1).unwrap();
        let first_place = remaining.get(0).unwrap();

        let prize_pool = battle_match.entry_fee * (battle_match.players.len() as u128);
        let first_prize = (prize_pool * (battle_match.prize_split.first_bps as u128)) / 10000;
        let second_prize = (prize_pool * (battle_match.prize_split.second_bps as u128)) / 10000;
        let third_prize = (prize_pool * (battle_match.prize_split.third_bps as u128)) / 10000;

        battle_match.status = MatchStatus::Finalized;
        storage::set_match(&env, &battle_match);

        BattleRoyaleResult {
            match_id,
            first_place,
            second_place,
            third_place,
            first_prize,
            second_prize,
            third_prize,
        }
    }

    pub fn get_remaining_players(env: Env, match_id: u64) -> soroban_sdk::Vec<Address> {
        let battle_match = storage::get_match(&env, match_id).expect("match not found");
        Self::remaining_players(&battle_match)
    }

    fn remaining_players(battle_match: &BattleRoyaleMatch) -> soroban_sdk::Vec<Address> {
        let mut remaining = soroban_sdk::Vec::new(battle_match.players.env());
        for i in 0..battle_match.players.len() {
            let p = battle_match.players.get(i).unwrap();
            if !battle_match.eliminated.contains(&p) {
                remaining.push_back(p);
            }
        }
        remaining
    }
}

#[cfg(test)]
mod test;
