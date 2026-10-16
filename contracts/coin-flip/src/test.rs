use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, BytesN, Env,
};
use stellarcade_random_generator::{RandomGenerator, RandomGeneratorClient};

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------

fn create_token<'a>(env: &'a Env, admin: &Address) -> (Address, StellarAssetClient<'a>) {
    let contract = env.register_stellar_asset_contract_v2(admin.clone());
    let client = StellarAssetClient::new(env, &contract.address());
    (contract.address(), client)
}

fn seed(env: &Env, byte: u8) -> BytesN<32> {
    let mut arr = [0u8; 32];
    arr[31] = byte;
    BytesN::from_array(env, &arr)
}

struct Setup<'a> {
    flip_client: CoinFlipClient<'a>,
    rng_client: RandomGeneratorClient<'a>,
    admin: Address,
    oracle: Address,
    token_addr: Address,
    token_sac: StellarAssetClient<'a>,
}

fn setup(env: &Env) -> Setup<'_> {
    let admin = Address::generate(env);
    let oracle = Address::generate(env);
    let token_admin = Address::generate(env);

    let (token_addr, token_sac) = create_token(env, &token_admin);

    // Deploy RNG
    let rng_id = env.register(RandomGenerator, ());
    let rng_client = RandomGeneratorClient::new(env, &rng_id);

    // Deploy CoinFlip
    let flip_id = env.register(CoinFlip, ());
    let flip_client = CoinFlipClient::new(env, &flip_id);

    env.mock_all_auths();

    // Init RNG and authorize coin flip as a caller
    rng_client.init(&admin, &oracle);
    rng_client.authorize(&admin, &flip_id);

    // Commit seed batch for tests
    let mut commitments = soroban_sdk::Vec::new(env);
    for i in 0u8..100 {
        let s = seed(env, i);
        let digest: BytesN<32> = env
            .crypto()
            .sha256(&soroban_sdk::Bytes::from_slice(env, &s.to_array()))
            .into();
        commitments.push_back(digest);
    }
    rng_client.commit_seeds(&oracle, &commitments);

    // Init CoinFlip: min=10, max=1000, house edge 250 bps (2.5%)
    flip_client.init(&admin, &rng_id, &token_addr, &10i128, &1000i128, &250i128);

    // Fund the contract so it can pay out winners
    token_sac.mint(&flip_id, &100_000i128);

    Setup {
        flip_client,
        rng_client,
        admin,
        oracle,
        token_addr,
        token_sac,
    }
}

fn tc<'a>(env: &'a Env, token: &Address) -> TokenClient<'a> {
    TokenClient::new(env, token)
}

// -------------------------------------------------------------------
// 1. Initialization
// -------------------------------------------------------------------

#[test]
fn test_init_rejects_reinit() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let rng = Address::generate(&env);
    let tok = Address::generate(&env);
    let result = s
        .flip_client
        .try_init(&s.admin, &rng, &tok, &10, &1000, &250);
    assert!(result.is_err());
}

// -------------------------------------------------------------------
// 2. Place bet happy path
// -------------------------------------------------------------------

#[test]
fn test_place_bet_stores_game() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500);

    s.flip_client.place_bet(&player, &HEADS, &100, &1u64);

    let game = s.flip_client.get_game(&1u64);
    assert_eq!(game.player, player);
    assert_eq!(game.side, HEADS);
    assert_eq!(game.wager, 100);
    assert!(!game.resolved);
}

// -------------------------------------------------------------------
// 3. Resolve win path
// -------------------------------------------------------------------

#[test]
fn test_resolve_win() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500);

    // Place bet on Heads (0)
    s.flip_client.place_bet(&player, &HEADS, &100, &1u64);

    // Fulfill RNG — we need to find a seed that gives result 0 (Heads)
    // result = sha256(seed || request_id)[0..8] % 2
    // Try seeds until we get 0
    let mut winning_seed = seed(&env, 0);
    for i in 0u8..=255 {
        let test_seed = seed(&env, i);
        let result = derive_rng_result(&env, &test_seed, 1u64, 2);
        if result == 0 {
            winning_seed = test_seed;
            break;
        }
    }

    s.rng_client.fulfill_random(&s.oracle, &1u64, &winning_seed);
    s.flip_client.resolve_bet(&1u64);

    let game = s.flip_client.get_game(&1u64);
    assert!(game.resolved);
    assert!(game.won);
    // Payout = 2 * 100 - (100 * 250 / 10000) = 200 - 2 = 198
    assert_eq!(game.payout, 198);

    // Player should have received payout
    assert_eq!(tc(&env, &s.token_addr).balance(&player), 598); // 500 - 100 + 198
}

// -------------------------------------------------------------------
// 4. Resolve loss path
// -------------------------------------------------------------------

#[test]
fn test_resolve_loss() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500);

    s.flip_client.place_bet(&player, &HEADS, &100, &2u64);

    // Find a seed that gives result 1 (Tails) — player bet Heads, so they lose
    let mut losing_seed = seed(&env, 0);
    for i in 0u8..=255 {
        let test_seed = seed(&env, i);
        let result = derive_rng_result(&env, &test_seed, 2u64, 2);
        if result == 1 {
            losing_seed = test_seed;
            break;
        }
    }

    s.rng_client.fulfill_random(&s.oracle, &2u64, &losing_seed);
    s.flip_client.resolve_bet(&2u64);

    let game = s.flip_client.get_game(&2u64);
    assert!(game.resolved);
    assert!(!game.won);
    assert_eq!(game.payout, 0);

    // Player lost their wager
    assert_eq!(tc(&env, &s.token_addr).balance(&player), 400);
}

// -------------------------------------------------------------------
// 5. Duplicate game_id rejected
// -------------------------------------------------------------------

#[test]
fn test_duplicate_game_id_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500);

    s.flip_client.place_bet(&player, &HEADS, &100, &1u64);
    let result = s.flip_client.try_place_bet(&player, &TAILS, &100, &1u64);
    assert!(result.is_err());
}

// -------------------------------------------------------------------
// 6. Invalid side rejected
// -------------------------------------------------------------------

#[test]
fn test_invalid_side_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500);

    let result = s.flip_client.try_place_bet(&player, &2u32, &100, &1u64);
    assert!(result.is_err());
}

// -------------------------------------------------------------------
// 7. Wager limits enforced
// -------------------------------------------------------------------

#[test]
fn test_wager_too_low_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500);

    let result = s.flip_client.try_place_bet(&player, &HEADS, &5, &1u64); // min is 10
    assert!(result.is_err());
}

#[test]
fn test_wager_too_high_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &5000);

    let result = s.flip_client.try_place_bet(&player, &HEADS, &1001, &1u64); // max is 1000
    assert!(result.is_err());
}

#[test]
fn test_zero_wager_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    let result = s.flip_client.try_place_bet(&player, &HEADS, &0, &1u64);
    assert!(result.is_err());
}

// -------------------------------------------------------------------
// 8. Resolve before RNG fulfillment rejected
// -------------------------------------------------------------------

#[test]
fn test_resolve_before_rng_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500);

    s.flip_client.place_bet(&player, &HEADS, &100, &1u64);

    // Don't fulfill RNG — try to resolve
    let result = s.flip_client.try_resolve_bet(&1u64);
    assert!(result.is_err());
}

// -------------------------------------------------------------------
// 9. Double resolution rejected
// -------------------------------------------------------------------

#[test]
fn test_double_resolve_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500);

    s.flip_client.place_bet(&player, &HEADS, &100, &1u64);

    let rng_seed = seed(&env, 42);
    s.rng_client.fulfill_random(&s.oracle, &1u64, &rng_seed);
    s.flip_client.resolve_bet(&1u64);

    let result = s.flip_client.try_resolve_bet(&1u64);
    assert!(result.is_err());
}

// -------------------------------------------------------------------
// 10. Game not found
// -------------------------------------------------------------------

#[test]
fn test_get_nonexistent_game() {
    let env = Env::default();
    let s = setup(&env);

    let result = s.flip_client.try_get_game(&99u64);
    assert!(result.is_err());
}

// -------------------------------------------------------------------
// 11. Multiple independent games
// -------------------------------------------------------------------

#[test]
fn test_multiple_games() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player1 = Address::generate(&env);
    let player2 = Address::generate(&env);
    s.token_sac.mint(&player1, &500);
    s.token_sac.mint(&player2, &500);

    s.flip_client.place_bet(&player1, &HEADS, &100, &10u64);
    s.flip_client.place_bet(&player2, &TAILS, &200, &20u64);

    let g1 = s.flip_client.get_game(&10u64);
    let g2 = s.flip_client.get_game(&20u64);
    assert_eq!(g1.player, player1);
    assert_eq!(g2.player, player2);
    assert_eq!(g1.wager, 100);
    assert_eq!(g2.wager, 200);
}

#[test]
fn test_recent_history_empty() {
    let env = Env::default();
    let s = setup(&env);
    let player = Address::generate(&env);

    let history = s.flip_client.get_recent_games(&player, &0, &5);
    assert_eq!(history.total, 0);
    assert_eq!(history.game_ids.len(), 0);
}

#[test]
fn test_recent_history_ordering() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &1_000);

    s.flip_client.place_bet(&player, &HEADS, &100, &11u64);
    s.flip_client.place_bet(&player, &TAILS, &100, &12u64);
    s.flip_client.place_bet(&player, &HEADS, &100, &13u64);

    let history = s.flip_client.get_recent_games(&player, &0, &10);
    assert_eq!(history.total, 3);
    assert_eq!(history.game_ids.get(0), Some(13u64));
    assert_eq!(history.game_ids.get(1), Some(12u64));
    assert_eq!(history.game_ids.get(2), Some(11u64));
}

#[test]
fn test_recent_history_retention_limit() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &5_000);

    for game_id in 1u64..=12 {
        s.flip_client.place_bet(&player, &HEADS, &100, &game_id);
    }

    let history = s.flip_client.get_recent_games(&player, &0, &20);
    assert_eq!(history.total, PLAYER_HISTORY_LIMIT);
    assert_eq!(history.game_ids.len(), PLAYER_HISTORY_LIMIT);
    assert_eq!(history.game_ids.get(0), Some(12u64));
    assert_eq!(history.game_ids.get(9), Some(3u64));
}

// -------------------------------------------------------------------
// Helper: reproduce RNG derivation for test seed selection
// -------------------------------------------------------------------

fn derive_rng_result(env: &Env, server_seed: &BytesN<32>, request_id: u64, max: u64) -> u64 {
    use soroban_sdk::Bytes;
    let mut preimage = [0u8; 40];
    preimage[..32].copy_from_slice(&server_seed.to_array());
    preimage[32..].copy_from_slice(&request_id.to_be_bytes());
    let digest: BytesN<32> = env
        .crypto()
        .sha256(&Bytes::from_slice(env, &preimage))
        .into();
    let arr = digest.to_array();
    let raw = u64::from_be_bytes([
        arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7],
    ]);
    raw % max
}

// -------------------------------------------------------------------
// House exposure snapshot tests
// -------------------------------------------------------------------

#[test]
fn test_exposure_snapshot_empty() {
    let env = Env::default();
    let s = setup(&env);
    let snap = s.flip_client.house_exposure_snapshot();
    assert_eq!(snap.active_game_count, 0);
    assert_eq!(snap.total_wagered, 0);
    assert_eq!(snap.max_payout_liability, 0);
}

#[test]
fn test_exposure_snapshot_single_active_game() {
    let env = Env::default();
    let s = setup(&env);
    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500i128);

    s.flip_client.place_bet(&player, &HEADS, &100, &1u64);

    let snap = s.flip_client.house_exposure_snapshot();
    assert_eq!(snap.active_game_count, 1);
    assert_eq!(snap.total_wagered, 100);
    // max_payout = 100 * (20_000 - 250) / 10_000 = 1_975_000 / 10_000 = 197
    // (conservative integer division; actual resolve payout may be 198)
    assert_eq!(snap.max_payout_liability, 197);
}

#[test]
fn test_exposure_snapshot_multi_game_aggregation() {
    let env = Env::default();
    let s = setup(&env);
    let p1 = Address::generate(&env);
    let p2 = Address::generate(&env);
    s.token_sac.mint(&p1, &500i128);
    s.token_sac.mint(&p2, &500i128);

    s.flip_client.place_bet(&p1, &HEADS, &100, &1u64);
    s.flip_client.place_bet(&p2, &TAILS, &200, &2u64);

    let snap = s.flip_client.house_exposure_snapshot();
    assert_eq!(snap.active_game_count, 2);
    assert_eq!(snap.total_wagered, 300);
    // max_payout = 300 * 19_750 / 10_000 = 592 (integer division)
    assert_eq!(snap.max_payout_liability, 592);
}

#[test]
fn test_exposure_snapshot_resets_after_resolve() {
    let env = Env::default();
    let s = setup(&env);
    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500i128);

    s.flip_client.place_bet(&player, &HEADS, &100, &42u64);

    let before = s.flip_client.house_exposure_snapshot();
    assert_eq!(before.active_game_count, 1);

    // Fulfill RNG and resolve so the exposure counter decrements
    let srv = seed(&env, 0);
    s.rng_client.fulfill_random(&s.oracle, &42u64, &srv);
    s.flip_client.resolve_bet(&42u64);

    let after = s.flip_client.house_exposure_snapshot();
    assert_eq!(after.active_game_count, 0);
    assert_eq!(after.total_wagered, 0);
    assert_eq!(after.max_payout_liability, 0);
}

// -------------------------------------------------------------------
// House Bankroll & Liquidity Tests (#1375)
// -------------------------------------------------------------------

#[test]
fn test_bet_rejected_when_bankroll_cannot_cover() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_addr, token_sac) = create_token(&env, &token_admin);

    let rng_id = env.register(RandomGenerator, ());
    let rng_client = RandomGeneratorClient::new(&env, &rng_id);
    let flip_id = env.register(CoinFlip, ());
    let flip_client = CoinFlipClient::new(&env, &flip_id);

    env.mock_all_auths();
    rng_client.init(&admin, &oracle);
    rng_client.authorize(&admin, &flip_id);

    let mut commitments = soroban_sdk::Vec::new(&env);
    commitments.push_back(env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &seed(&env, 0).to_array())).into());
    rng_client.commit_seeds(&oracle, &commitments);

    flip_client.init(&admin, &rng_id, &token_addr, &10i128, &1000i128, &250i128);

    // Bankroll is 0 tokens!
    let player = Address::generate(&env);
    token_sac.mint(&player, &500i128);

    // Bet of 100 requires liability 197 tokens. Bankroll (0) + wager (100) = 100 < 197.
    let res = flip_client.try_place_bet(&player, &HEADS, &100i128, &1u64);
    assert_eq!(res, Err(Ok(Error::InsufficientHouseLiquidity)));

    // Player balance must be completely unchanged
    assert_eq!(tc(&env, &token_addr).balance(&player), 500i128);
}

#[test]
fn test_bet_accepted_when_bankroll_covers_exactly() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_addr, token_sac) = create_token(&env, &token_admin);

    let rng_id = env.register(RandomGenerator, ());
    let rng_client = RandomGeneratorClient::new(&env, &rng_id);
    let flip_id = env.register(CoinFlip, ());
    let flip_client = CoinFlipClient::new(&env, &flip_id);

    env.mock_all_auths();
    rng_client.init(&admin, &oracle);
    rng_client.authorize(&admin, &flip_id);

    let mut commitments = soroban_sdk::Vec::new(&env);
    commitments.push_back(env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &seed(&env, 0).to_array())).into());
    rng_client.commit_seeds(&oracle, &commitments);

    flip_client.init(&admin, &rng_id, &token_addr, &10i128, &1000i128, &250i128);

    // Wager = 100. max_liability = 100 * 19_750 / 10_000 = 197.
    // Total available = balance + wager. So balance must be 97.
    token_sac.mint(&flip_id, &97i128);

    let player = Address::generate(&env);
    token_sac.mint(&player, &500i128);

    let res = flip_client.try_place_bet(&player, &HEADS, &100i128, &1u64);
    assert!(res.is_ok());
    assert_eq!(tc(&env, &token_addr).balance(&player), 400i128);
}

#[test]
fn test_withdraw_house_below_liability_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let player = Address::generate(&env);
    s.token_sac.mint(&player, &500i128);

    s.flip_client.place_bet(&player, &HEADS, &100i128, &1u64);
    // Liability is 197. Current contract balance is 100_000 + 100 = 100_100.
    // Attempting to withdraw 100_000 leaves balance 100 < 197 liability.
    let res = s.flip_client.try_withdraw_house(&s.admin, &100_000i128);
    assert_eq!(res, Err(Ok(Error::InsufficientHouseLiquidity)));

    // Withdrawing an amount that preserves at least 197 succeeds
    let ok_res = s.flip_client.try_withdraw_house(&s.admin, &50_000i128);
    assert!(ok_res.is_ok());
}

#[test]
fn test_funding_and_winning_bet_payout() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let oracle = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_addr, token_sac) = create_token(&env, &token_admin);

    let rng_id = env.register(RandomGenerator, ());
    let rng_client = RandomGeneratorClient::new(&env, &rng_id);
    let flip_id = env.register(CoinFlip, ());
    let flip_client = CoinFlipClient::new(&env, &flip_id);

    env.mock_all_auths();
    rng_client.init(&admin, &oracle);
    rng_client.authorize(&admin, &flip_id);

    let mut commitments = soroban_sdk::Vec::new(&env);
    commitments.push_back(env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &seed(&env, 0).to_array())).into());
    rng_client.commit_seeds(&oracle, &commitments);

    flip_client.init(&admin, &rng_id, &token_addr, &10i128, &1000i128, &250i128);

    // Admin funds house bankroll
    token_sac.mint(&admin, &10_000i128);
    flip_client.fund_house(&admin, &5_000i128);
    assert_eq!(flip_client.house_balance(), 5_000i128);

    let player = Address::generate(&env);
    token_sac.mint(&player, &500i128);

    flip_client.place_bet(&player, &HEADS, &100i128, &1u64);
    rng_client.fulfill_random(&oracle, &1u64, &seed(&env, 0));
    flip_client.resolve_bet(&1u64);

    let game = flip_client.get_game(&1u64);
    assert!(game.won);
    assert_eq!(tc(&env, &token_addr).balance(&player), 598i128);
}

#[test]
fn test_non_admin_fund_and_withdraw_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let impostor = Address::generate(&env);
    assert_eq!(s.flip_client.try_fund_house(&impostor, &100i128), Err(Ok(Error::NotAuthorized)));
    assert_eq!(s.flip_client.try_withdraw_house(&impostor, &100i128), Err(Ok(Error::NotAuthorized)));
}
