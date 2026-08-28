//! Stellarcade Minesweeper Escrow Contract (experimental)
//!
//! A single-player wager game: the player commits a wager and a
//! `board_hash` seed, then reveals grid tiles one at a time. Each safe tile
//! increases a payout multiplier; hitting a mine loses the wager
//! immediately. The player may `cashout` after any safe reveal to collect
//! the wager times the current multiplier.
//!
//! ## Bankroll requirement
//! A cashout above 1.00x pays out more than the player's own wager, so the
//! contract's token balance must be pre-funded (e.g. by the admin
//! transferring liquidity directly to `env.current_contract_address()`)
//! beyond what any single player has escrowed — a lost wager (mine hit)
//! adds to that bankroll, but a fresh deployment needs seed liquidity
//! before the first game can safely support a >1.00x cashout. This
//! contract does not itself enforce a bankroll-sufficiency check at
//! `start_game` time; an insufficient bankroll simply causes `cashout`'s
//! token transfer to fail for that player, exactly like a real token
//! transfer with insufficient balance would.
//!
//! ## Mine layout & auditability
//! Mine positions are not stored explicitly — they are derived
//! deterministically from `sha256(board_hash || row_be_bytes || col_be_bytes)`
//! (a tile is a mine if the derived byte falls under a threshold set by
//! `mine_count / grid_size^2`). Since `board_hash` is fixed at
//! `start_game` and never changes, the full layout is fixed at that point
//! and independently re-derivable by anyone from `board_hash` alone —
//! there is no separate salt to reveal after the fact. This follows the
//! same auditable, caller-supplied-seed convention used by the coinflip
//! streak and jackpot distributor contracts elsewhere in this experimental
//! workspace, rather than a VRF/oracle (not available in this environment).

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, Bytes, BytesN, Env};

pub use types::{CashoutResult, GameStatus, MinesweeperSummary, TileRevealResult};

/// Payout multiplier awarded per safe tile revealed, in basis points
/// (10000 = 1.00x). A flat per-tile bump keeps the math simple and
/// auditable; it does not scale with remaining mine density.
pub const MULTIPLIER_PER_SAFE_TILE_BPS: u32 = 2_000; // +0.20x per safe tile
pub const BASE_MULTIPLIER_BPS: u32 = 10_000; // 1.00x

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidGridSize = 3,
    InvalidMineCount = 4,
    InvalidWager = 5,
    GameNotFound = 6,
    NotPlayer = 7,
    GameNotActive = 8,
    InvalidTileCoordinate = 9,
    TileAlreadyRevealed = 10,
    NoSafeTilesRevealedYet = 11,
    MathOverflow = 12,
}

#[contract]
pub struct MinesweeperEscrow;

#[contractimpl]
impl MinesweeperEscrow {
    /// One-time setup: admin and the wager token.
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        if storage::read_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        env.storage()
            .instance()
            .set(&storage::DataKey::Admin, &admin);
        env.storage().instance().set(&storage::DataKey::Token, &token);
        Ok(())
    }

    /// Start a new game: escrow `wager_amount` from `player`, and fix the
    /// mine layout by committing `board_hash`.
    pub fn start_game(
        env: Env,
        player: Address,
        wager_amount: i128,
        grid_size: u32,
        mine_count: u32,
        board_hash: BytesN<32>,
    ) -> Result<u64, Error> {
        player.require_auth();
        if storage::read_admin(&env).is_none() {
            return Err(Error::NotInitialized);
        }
        if grid_size < 2 {
            return Err(Error::InvalidGridSize);
        }
        let total_tiles = grid_size
            .checked_mul(grid_size)
            .ok_or(Error::MathOverflow)?;
        if mine_count == 0 || mine_count >= total_tiles {
            return Err(Error::InvalidMineCount);
        }
        if wager_amount <= 0 {
            return Err(Error::InvalidWager);
        }

        let contract_address = env.current_contract_address();
        token::Client::new(&env, &storage::read_token(&env)).transfer(
            &player,
            &contract_address,
            &wager_amount,
        );

        let id = storage::read_next_game_id(&env);
        storage::write_next_game_id(&env, id + 1);

        let game = MinesweeperSummary {
            id,
            player,
            wager_amount,
            grid_size,
            mine_count,
            board_hash,
            tiles_revealed: 0,
            multiplier_bps: BASE_MULTIPLIER_BPS,
            status: GameStatus::Active,
        };
        storage::write_game(&env, id, &game);
        Ok(id)
    }

    /// Reveal one tile. Safe tiles bump the multiplier; a mine ends the
    /// game with zero payout.
    pub fn reveal_tile(
        env: Env,
        game_id: u64,
        player: Address,
        row: u32,
        col: u32,
    ) -> Result<TileRevealResult, Error> {
        player.require_auth();
        let mut game = storage::read_game(&env, game_id).ok_or(Error::GameNotFound)?;
        if game.player != player {
            return Err(Error::NotPlayer);
        }
        if !matches!(game.status, GameStatus::Active) {
            return Err(Error::GameNotActive);
        }
        if row >= game.grid_size || col >= game.grid_size {
            return Err(Error::InvalidTileCoordinate);
        }
        if storage::is_tile_revealed(&env, game_id, row, col) {
            return Err(Error::TileAlreadyRevealed);
        }

        storage::mark_tile_revealed(&env, game_id, row, col);
        let is_mine = tile_is_mine(&env, &game.board_hash, game.grid_size, game.mine_count, row, col);

        if is_mine {
            game.status = GameStatus::Lost;
            storage::write_game(&env, game_id, &game);
            return Ok(TileRevealResult {
                is_mine: true,
                multiplier_bps: 0,
                status: GameStatus::Lost,
            });
        }

        game.tiles_revealed = game
            .tiles_revealed
            .checked_add(1)
            .ok_or(Error::MathOverflow)?;
        game.multiplier_bps = BASE_MULTIPLIER_BPS
            .checked_add(
                MULTIPLIER_PER_SAFE_TILE_BPS
                    .checked_mul(game.tiles_revealed)
                    .ok_or(Error::MathOverflow)?,
            )
            .ok_or(Error::MathOverflow)?;
        storage::write_game(&env, game_id, &game);

        Ok(TileRevealResult {
            is_mine: false,
            multiplier_bps: game.multiplier_bps,
            status: GameStatus::Active,
        })
    }

    /// Cash out at the current multiplier, closing the game and paying out
    /// `wager_amount * multiplier_bps / 10_000`.
    pub fn cashout(env: Env, game_id: u64, player: Address) -> Result<CashoutResult, Error> {
        player.require_auth();
        let mut game = storage::read_game(&env, game_id).ok_or(Error::GameNotFound)?;
        if game.player != player {
            return Err(Error::NotPlayer);
        }
        if !matches!(game.status, GameStatus::Active) {
            return Err(Error::GameNotActive);
        }
        if game.tiles_revealed == 0 {
            return Err(Error::NoSafeTilesRevealedYet);
        }

        let payout = game
            .wager_amount
            .checked_mul(game.multiplier_bps as i128)
            .ok_or(Error::MathOverflow)?
            / BASE_MULTIPLIER_BPS as i128;

        game.status = GameStatus::CashedOut;
        storage::write_game(&env, game_id, &game);

        if payout > 0 {
            token::Client::new(&env, &storage::read_token(&env)).transfer(
                &env.current_contract_address(),
                &player,
                &payout,
            );
        }

        Ok(CashoutResult {
            payout,
            multiplier_bps: game.multiplier_bps,
        })
    }

    /// Full game state.
    pub fn get_game_summary(env: Env, game_id: u64) -> Result<MinesweeperSummary, Error> {
        storage::read_game(&env, game_id).ok_or(Error::GameNotFound)
    }
}

/// Derive whether `(row, col)` is a mine from the game's committed
/// `board_hash`: `sha256(board_hash || row_be || col_be)`'s first byte,
/// taken modulo the total tile count, falls in `[0, mine_count)`.
///
/// This gives each tile an independent, deterministic, but not exactly
/// `mine_count`-fixed outcome (a probabilistic approximation, not an exact
/// combinatorial mine placement) — acceptable for this experimental
/// contract; a production version would derive an exact Fisher-Yates
/// shuffle of tile indices from the same seed instead.
fn tile_is_mine(
    env: &Env,
    board_hash: &BytesN<32>,
    grid_size: u32,
    mine_count: u32,
    row: u32,
    col: u32,
) -> bool {
    let mut preimage = Bytes::new(env);
    preimage.append(&Bytes::from_array(env, &board_hash.to_array()));
    preimage.append(&Bytes::from_array(env, &row.to_be_bytes()));
    preimage.append(&Bytes::from_array(env, &col.to_be_bytes()));
    let digest = env.crypto().sha256(&preimage).to_bytes();
    let byte = digest.to_array()[0] as u32;
    let total_tiles = grid_size * grid_size;
    (byte % total_tiles) < mine_count
}
