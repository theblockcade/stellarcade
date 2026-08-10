#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
pub mod types;

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, Vec,
};

pub use types::{ConfigView, GameSummary, PredictionView};

use storage::*;

pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;
pub const MAX_PLAYERS_PER_GAME: u32 = 500;

pub const COLOR_RED: u32 = 0;
pub const COLOR_GREEN: u32 = 1;
pub const COLOR_BLUE: u32 = 2;
pub const COLOR_YELLOW: u32 = 3;
pub const COLOR_MAX: u32 = COLOR_YELLOW;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    InvalidColor = 4,
    InvalidAmount = 5,
    GameNotFound = 6,
    GameAlreadyResolved = 7,
    AlreadyPredicted = 8,
    GameFull = 9,
    Overflow = 10,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum GameStatus {
    Open = 0,
    Resolved = 1,
}

#[contracttype]
#[derive(Clone)]
pub struct GameData {
    pub total_pot: i128,
    pub player_count: u32,
    pub winner_count: u32,
    pub winning_color: u32,
    pub status: GameStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PredictionEntry {
    pub color: u32,
    pub wager: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    RngContract,
    PrizePoolContract,
    BalanceContract,
    Game(u64),
    PlayerList(u64),
    Prediction(u64, Address),
}

#[contractevent]
pub struct PredictionPlaced {
    #[topic]
    pub game_id: u64,
    #[topic]
    pub player: Address,
    pub color: u32,
    pub wager: i128,
}

#[contractevent]
pub struct PredictionResolved {
    #[topic]
    pub game_id: u64,
    pub winning_color: u32,
    pub winner_count: u32,
    pub total_pot: i128,
}

#[contract]
pub struct ColorPrediction;

#[contractimpl]
impl ColorPrediction {
    pub fn init(
        env: Env,
        admin: Address,
        rng_contract: Address,
        prize_pool_contract: Address,
        balance_contract: Address,
    ) -> Result<(), Error> {
        if is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::RngContract, &rng_contract);
        env.storage()
            .instance()
            .set(&DataKey::PrizePoolContract, &prize_pool_contract);
        env.storage()
            .instance()
            .set(&DataKey::BalanceContract, &balance_contract);

        Ok(())
    }

    pub fn place_prediction(
        env: Env,
        player: Address,
        color: u32,
        wager: i128,
        game_id: u64,
    ) -> Result<(), Error> {
        if !is_initialized(&env) {
            return Err(Error::NotInitialized);
        }
        player.require_auth();

        if color > COLOR_MAX {
            return Err(Error::InvalidColor);
        }
        if wager <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut game: GameData = get_game(&env, game_id).unwrap_or(GameData {
            total_pot: 0,
            player_count: 0,
            winner_count: 0,
            winning_color: 0,
            status: GameStatus::Open,
        });

        if game.status != GameStatus::Open {
            return Err(Error::GameAlreadyResolved);
        }

        if game.player_count >= MAX_PLAYERS_PER_GAME {
            return Err(Error::GameFull);
        }

        if player_has_predicted(&env, game_id, &player) {
            return Err(Error::AlreadyPredicted);
        }

        let entry = PredictionEntry { color, wager };
        set_prediction(&env, game_id, &player, &entry);

        let mut players = get_players(&env, game_id);
        players.push_back(player.clone());
        set_players(&env, game_id, &players);

        game.total_pot = game.total_pot.checked_add(wager).ok_or(Error::Overflow)?;
        game.player_count = game.player_count.checked_add(1).ok_or(Error::Overflow)?;
        set_game(&env, game_id, &game);

        PredictionPlaced {
            game_id,
            player,
            color,
            wager,
        }
        .publish(&env);

        Ok(())
    }

    pub fn resolve_prediction(env: Env, game_id: u64, winning_color: u32) -> Result<(), Error> {
        let admin = get_admin(&env).ok_or(Error::NotInitialized)?;
        admin.require_auth();

        if winning_color > COLOR_MAX {
            return Err(Error::InvalidColor);
        }

        let mut game: GameData = get_game(&env, game_id).ok_or(Error::GameNotFound)?;

        if game.status != GameStatus::Open {
            return Err(Error::GameAlreadyResolved);
        }

        let players = get_players(&env, game_id);

        let mut winner_count: u32 = 0;

        for player in players.iter() {
            if let Some(entry) = get_prediction(&env, game_id, &player) {
                if entry.color == winning_color {
                    winner_count = winner_count.checked_add(1).ok_or(Error::Overflow)?;
                }
            }
        }

        game.status = GameStatus::Resolved;
        game.winning_color = winning_color;
        game.winner_count = winner_count;
        set_game(&env, game_id, &game);

        PredictionResolved {
            game_id,
            winning_color,
            winner_count,
            total_pot: game.total_pot,
        }
        .publish(&env);

        Ok(())
    }

    pub fn get_game(env: Env, game_id: u64) -> Option<GameData> {
        get_game(&env, game_id)
    }

    pub fn get_prediction(env: Env, game_id: u64, player: Address) -> PredictionView {
        match get_prediction(&env, game_id, &player) {
            Some(entry) => PredictionView {
                exists: true,
                game_id,
                player: player.clone(),
                color: entry.color,
                wager: entry.wager,
            },
            None => PredictionView {
                exists: false,
                game_id,
                player: player.clone(),
                color: 0,
                wager: 0,
            },
        }
    }

    pub fn get_players(env: Env, game_id: u64) -> Vec<Address> {
        get_players(&env, game_id)
    }

    pub fn is_initialized(env: Env) -> bool {
        is_initialized(&env)
    }

    pub fn get_config(env: Env) -> ConfigView {
        ConfigView {
            initialized: is_initialized(&env),
            admin: get_admin(&env),
            rng_contract: get_rng_contract(&env),
            prize_pool_contract: get_prize_pool_contract(&env),
            balance_contract: get_balance_contract(&env),
        }
    }

    pub fn player_has_predicted(env: Env, game_id: u64, player: Address) -> bool {
        player_has_predicted(&env, game_id, &player)
    }

    pub fn game_summary(env: Env, game_id: u64) -> GameSummary {
        match get_game(&env, game_id) {
            Some(game) => {
                let resolved = game.status == GameStatus::Resolved;
                GameSummary {
                    game_id,
                    exists: true,
                    resolved,
                    total_pot: game.total_pot,
                    player_count: game.player_count,
                    winner_count: game.winner_count,
                    winning_color: game.winning_color,
                }
            }
            None => GameSummary {
                game_id,
                exists: false,
                resolved: false,
                total_pot: 0,
                player_count: 0,
                winner_count: 0,
                winning_color: 0,
            },
        }
    }
}

#[cfg(test)]
mod test;
