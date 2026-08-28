#![cfg(test)]

use soroban_sdk::{testutils::Address as _, token, Address, Bytes, BytesN, Env};

use crate::{Error, GameStatus, MinesweeperEscrow, MinesweeperEscrowClient};

const GRID_SIZE: u32 = 5;
const MINE_COUNT: u32 = 3;
const WAGER: i128 = 1_000;

struct Setup {
    env: Env,
    client: MinesweeperEscrowClient<'static>,
    token: token::Client<'static>,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());

    let contract_id = env.register(MinesweeperEscrow, ());
    let client = MinesweeperEscrowClient::new(&env, &contract_id);
    client.initialize(&admin, &sac.address());

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
    }
}

fn fund(s: &Setup, player: &Address, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.token.address).mint(player, &amount);
}

/// Whether `(row, col)` is a mine under this contract's derivation, given
/// a raw seed byte array used directly as the board hash. Mirrors
/// `tile_is_mine` in lib.rs exactly, so tests can pick seeds/tiles with a
/// known, deterministic outcome instead of guessing.
fn is_mine(env: &Env, board_hash: &BytesN<32>, row: u32, col: u32) -> bool {
    let mut preimage = Bytes::new(env);
    preimage.append(&Bytes::from_array(env, &board_hash.to_array()));
    preimage.append(&Bytes::from_array(env, &row.to_be_bytes()));
    preimage.append(&Bytes::from_array(env, &col.to_be_bytes()));
    let digest = env.crypto().sha256(&preimage).to_bytes();
    let byte = digest.to_array()[0] as u32;
    (byte % (GRID_SIZE * GRID_SIZE)) < MINE_COUNT
}

/// Find a board hash (by scanning a byte counter) and enough distinct safe
/// tiles for a full grid under it, so tests don't depend on incidental
/// hash luck. Returns up to `GRID_SIZE * GRID_SIZE` tiles in a fixed-size
/// buffer (no heap allocation available in this `#![no_std]` crate's test
/// binary) plus how many of the leading entries are populated.
fn find_seed_with_n_safe_tiles(
    env: &Env,
    n: usize,
) -> (BytesN<32>, [(u32, u32); 25], usize) {
    for seed_byte in 0u8..=255 {
        let board_hash = BytesN::from_array(env, &[seed_byte; 32]);
        let mut safe_tiles = [(0u32, 0u32); 25];
        let mut count = 0usize;
        for row in 0..GRID_SIZE {
            for col in 0..GRID_SIZE {
                if !is_mine(env, &board_hash, row, col) {
                    safe_tiles[count] = (row, col);
                    count += 1;
                }
            }
        }
        if count >= n {
            return (board_hash, safe_tiles, count);
        }
    }
    panic!("no seed found with enough safe tiles in range");
}

fn find_seed_with_mine_at_origin(env: &Env) -> BytesN<32> {
    for seed_byte in 0u8..=255 {
        let board_hash = BytesN::from_array(env, &[seed_byte; 32]);
        if is_mine(env, &board_hash, 0, 0) {
            return board_hash;
        }
    }
    panic!("no seed found with a mine at (0,0)");
}

#[test]
fn happy_path_three_safe_picks_then_cashout() {
    let s = setup();
    let player = Address::generate(&s.env);
    fund(&s, &player, WAGER);
    // A payout above 1.00x pays out more than the player's own wager, so
    // the contract needs bankroll liquidity beyond the escrowed wager —
    // see the "Bankroll requirement" note in lib.rs.
    fund(&s, &s.client.address, WAGER);

    let (board_hash, safe_tiles, _) = find_seed_with_n_safe_tiles(&s.env, 3);
    let id = s
        .client
        .start_game(&player, &WAGER, &GRID_SIZE, &MINE_COUNT, &board_hash);

    for (i, (row, col)) in safe_tiles.iter().enumerate().take(3) {
        let result = s.client.reveal_tile(&id, &player, row, col);
        assert!(!result.is_mine);
        assert_eq!(result.multiplier_bps, 10_000 + 2_000 * (i as u32 + 1));
    }

    let cashout = s.client.cashout(&id, &player);
    // 3 safe tiles: multiplier = 1.0 + 3*0.2 = 1.6x -> payout = 1600.
    assert_eq!(cashout.multiplier_bps, 16_000);
    assert_eq!(cashout.payout, 1_600);
    assert_eq!(s.token.balance(&player), 1_600);

    let game = s.client.get_game_summary(&id);
    assert_eq!(game.status, GameStatus::CashedOut);
}

#[test]
fn hitting_a_mine_on_first_pick_ends_game_with_zero_payout() {
    let s = setup();
    let player = Address::generate(&s.env);
    fund(&s, &player, WAGER);

    let board_hash = find_seed_with_mine_at_origin(&s.env);
    let id = s
        .client
        .start_game(&player, &WAGER, &GRID_SIZE, &MINE_COUNT, &board_hash);

    let result = s.client.reveal_tile(&id, &player, &0, &0);
    assert!(result.is_mine);
    assert_eq!(result.multiplier_bps, 0);
    assert_eq!(result.status, GameStatus::Lost);

    let game = s.client.get_game_summary(&id);
    assert_eq!(game.status, GameStatus::Lost);

    // Wager stays escrowed in the contract; player receives nothing back.
    assert_eq!(s.token.balance(&player), 0);
    assert_eq!(s.token.balance(&s.client.address), WAGER);
}

#[test]
fn invalid_tile_coordinate_is_rejected() {
    let s = setup();
    let player = Address::generate(&s.env);
    fund(&s, &player, WAGER);

    let board_hash = BytesN::from_array(&s.env, &[7u8; 32]);
    let id = s
        .client
        .start_game(&player, &WAGER, &GRID_SIZE, &MINE_COUNT, &board_hash);

    let result = s.client.try_reveal_tile(&id, &player, &GRID_SIZE, &0);
    assert_eq!(result, Err(Ok(Error::InvalidTileCoordinate)));
}

#[test]
fn revealing_the_same_tile_twice_is_rejected() {
    let s = setup();
    let player = Address::generate(&s.env);
    fund(&s, &player, WAGER);

    let (board_hash, safe_tiles, _) = find_seed_with_n_safe_tiles(&s.env, 1);
    let id = s
        .client
        .start_game(&player, &WAGER, &GRID_SIZE, &MINE_COUNT, &board_hash);

    let (row, col) = safe_tiles[0];
    s.client.reveal_tile(&id, &player, &row, &col);

    let result = s.client.try_reveal_tile(&id, &player, &row, &col);
    assert_eq!(result, Err(Ok(Error::TileAlreadyRevealed)));
}

#[test]
fn cashout_before_any_safe_reveal_is_rejected() {
    let s = setup();
    let player = Address::generate(&s.env);
    fund(&s, &player, WAGER);

    let board_hash = BytesN::from_array(&s.env, &[3u8; 32]);
    let id = s
        .client
        .start_game(&player, &WAGER, &GRID_SIZE, &MINE_COUNT, &board_hash);

    let result = s.client.try_cashout(&id, &player);
    assert_eq!(result, Err(Ok(Error::NoSafeTilesRevealedYet)));
}

#[test]
fn cannot_act_on_a_finished_game() {
    let s = setup();
    let player = Address::generate(&s.env);
    fund(&s, &player, WAGER);

    let board_hash = find_seed_with_mine_at_origin(&s.env);
    let id = s
        .client
        .start_game(&player, &WAGER, &GRID_SIZE, &MINE_COUNT, &board_hash);
    s.client.reveal_tile(&id, &player, &0, &0); // hits a mine, game is Lost

    let result = s.client.try_reveal_tile(&id, &player, &1, &1);
    assert_eq!(result, Err(Ok(Error::GameNotActive)));

    let result = s.client.try_cashout(&id, &player);
    assert_eq!(result, Err(Ok(Error::GameNotActive)));
}

#[test]
fn invalid_mine_count_is_rejected() {
    let s = setup();
    let player = Address::generate(&s.env);
    fund(&s, &player, WAGER);

    let board_hash = BytesN::from_array(&s.env, &[1u8; 32]);
    // mine_count >= total_tiles (25) is invalid.
    let result = s
        .client
        .try_start_game(&player, &WAGER, &GRID_SIZE, &25, &board_hash);
    assert_eq!(result, Err(Ok(Error::InvalidMineCount)));
}
