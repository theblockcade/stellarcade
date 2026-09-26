#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Bytes, BytesN, Env,
};

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

#[allow(dead_code)]
struct Setup<'a> {
    client: WheelOfFortuneClient<'a>,
    admin: Address,
    player: Address,
    token_addr: Address,
    token_sac: StellarAssetClient<'a>,
}

fn setup(env: &Env) -> Setup<'_> {
    let admin = Address::generate(env);
    let player = Address::generate(env);
    let token_admin = Address::generate(env);

    let (token_addr, token_sac) = create_token(env, &token_admin);

    let contract_id = env.register(WheelOfFortune, ());
    let client = WheelOfFortuneClient::new(env, &contract_id);

    env.mock_all_auths();

    client.initialize(&admin, &token_addr, &10i128, &1_000i128);

    // Fund player wallet and the house reserve so max (10x) payouts can
    // always be covered.
    token_sac.mint(&player, &100_000i128);
    token_sac.mint(&admin, &100_000i128);
    client.fund_house(&admin, &50_000i128);

    Setup {
        client,
        admin,
        player,
        token_addr,
        token_sac,
    }
}

fn tc<'a>(env: &'a Env, token: &Address) -> TokenClient<'a> {
    TokenClient::new(env, token)
}

/// Reproduce the contract's randomness derivation to find a server_secret
/// that lands on a desired segment index for a given (client_seed, nonce).
fn derive_segment(
    env: &Env,
    server_secret: &BytesN<32>,
    client_seed: &BytesN<32>,
    nonce: u64,
) -> u32 {
    let mut preimage = [0u8; 72];
    preimage[..32].copy_from_slice(&server_secret.to_array());
    preimage[32..64].copy_from_slice(&client_seed.to_array());
    preimage[64..].copy_from_slice(&nonce.to_be_bytes());
    let digest: BytesN<32> = env
        .crypto()
        .sha256(&Bytes::from_slice(env, &preimage))
        .into();
    let arr = digest.to_array();
    let raw = u64::from_be_bytes([
        arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7],
    ]);
    (raw % SEGMENT_COUNT_TEST) as u32
}

const SEGMENT_COUNT_TEST: u64 = 8;

fn find_secret_for_segment(
    env: &Env,
    client_seed: &BytesN<32>,
    nonce: u64,
    desired_segment: u32,
) -> BytesN<32> {
    for i in 0u8..=255 {
        let candidate = seed(env, i);
        if derive_segment(env, &candidate, client_seed, nonce) == desired_segment {
            return candidate;
        }
    }
    panic!(
        "could not find a server_secret for segment {} at nonce {}",
        desired_segment, nonce
    );
}

// -------------------------------------------------------------------
// 1. initialize
// -------------------------------------------------------------------

#[test]
fn test_initialize_rejects_reinit() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let result = s
        .client
        .try_initialize(&s.admin, &s.token_addr, &10i128, &1_000i128);
    assert!(result.is_err());
}

#[test]
fn test_initialize_rejects_invalid_wager_range() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let token = Address::generate(&env);
    let contract_id = env.register(WheelOfFortune, ());
    let client = WheelOfFortuneClient::new(&env, &contract_id);
    env.mock_all_auths();

    let result = client.try_initialize(&admin, &token, &100i128, &10i128);
    assert!(result.is_err());
}

// -------------------------------------------------------------------
// 2. spin placement + escrow lock
// -------------------------------------------------------------------

#[test]
fn test_spin_placement_locks_escrow() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let token_client = tc(&env, &s.token_addr);
    let player_balance_before = token_client.balance(&s.player);
    let contract_balance_before = token_client.balance(&s.client.address);

    let client_seed = seed(&env, 1);
    let spin_id = s.client.spin_wheel(&s.player, &100i128, &client_seed);
    assert_eq!(spin_id, 1u64);

    // Wager moved from player into contract escrow.
    assert_eq!(token_client.balance(&s.player), player_balance_before - 100);
    assert_eq!(
        token_client.balance(&s.client.address),
        contract_balance_before + 100
    );
    assert_eq!(s.client.escrow_total(), 100i128);

    let info = s.client.get_spin_info(&spin_id);
    assert_eq!(info.player, s.player);
    assert_eq!(info.wager_amount, 100i128);
    assert_eq!(info.status, SpinStatus::Pending);
}

// -------------------------------------------------------------------
// 3. winning spin calculation and payout transfer
// -------------------------------------------------------------------

#[test]
fn test_winning_spin_pays_out() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let client_seed = seed(&env, 7);
    let wager = 100i128;
    let spin_id = s.client.spin_wheel(&s.player, &wager, &client_seed);

    let info = s.client.get_spin_info(&spin_id);
    // Segment index 7 == 10x multiplier (1000 bp).
    let secret = find_secret_for_segment(&env, &client_seed, info.nonce, 7);

    let token_client = tc(&env, &s.token_addr);
    let player_balance_before = token_client.balance(&s.player);
    let house_reserve_before = s.client.house_reserve();

    let payout = s.client.settle_spin(&spin_id, &secret);
    assert_eq!(payout, wager * 10);

    assert_eq!(
        token_client.balance(&s.player),
        player_balance_before + payout
    );

    // House reserve absorbs the profit portion of the payout.
    let profit = payout - wager;
    assert_eq!(s.client.house_reserve(), house_reserve_before - profit);

    let settled = s.client.get_spin_info(&spin_id);
    assert_eq!(settled.status, SpinStatus::Settled);
    assert_eq!(settled.segment_index, 7u32);
    assert_eq!(settled.multiplier_bp, 1000u32);
    assert_eq!(settled.payout, payout);

    // Escrow released back down to zero after settlement.
    assert_eq!(s.client.escrow_total(), 0i128);
}

// -------------------------------------------------------------------
// 4. losing (0x) spin retained by house bankroll
// -------------------------------------------------------------------

#[test]
fn test_losing_spin_retained_by_house() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let client_seed = seed(&env, 9);
    let wager = 100i128;
    let spin_id = s.client.spin_wheel(&s.player, &wager, &client_seed);

    let info = s.client.get_spin_info(&spin_id);
    // Segment index 0 == 0x multiplier (bust).
    let secret = find_secret_for_segment(&env, &client_seed, info.nonce, 0);

    let token_client = tc(&env, &s.token_addr);
    let player_balance_before = token_client.balance(&s.player);
    let house_reserve_before = s.client.house_reserve();

    let payout = s.client.settle_spin(&spin_id, &secret);
    assert_eq!(payout, 0i128);

    // Player receives nothing; balance unchanged from before settlement.
    assert_eq!(token_client.balance(&s.player), player_balance_before);

    // House reserve grows by the full wager amount.
    assert_eq!(s.client.house_reserve(), house_reserve_before + wager);

    let settled = s.client.get_spin_info(&spin_id);
    assert_eq!(settled.segment_index, 0u32);
    assert_eq!(settled.multiplier_bp, 0u32);
    assert_eq!(settled.payout, 0i128);
}

// -------------------------------------------------------------------
// 5. max wager bound rejections
// -------------------------------------------------------------------

#[test]
fn test_spin_rejects_wager_below_min() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let client_seed = seed(&env, 2);
    let result = s.client.try_spin_wheel(&s.player, &5i128, &client_seed);
    assert!(result.is_err());
}

#[test]
fn test_spin_rejects_wager_above_max() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let client_seed = seed(&env, 3);
    let result = s.client.try_spin_wheel(&s.player, &1_001i128, &client_seed);
    assert!(result.is_err());
}

#[test]
fn test_spin_rejects_zero_or_negative_wager() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let client_seed = seed(&env, 4);
    assert!(s
        .client
        .try_spin_wheel(&s.player, &0i128, &client_seed)
        .is_err());
    assert!(s
        .client
        .try_spin_wheel(&s.player, &-10i128, &client_seed)
        .is_err());
}

// -------------------------------------------------------------------
// 6. bankroll / pause guards
// -------------------------------------------------------------------

#[test]
fn test_spin_rejects_when_house_bankroll_insufficient() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let (token_addr, token_sac) = create_token(&env, &token_admin);

    let contract_id = env.register(WheelOfFortune, ());
    let client = WheelOfFortuneClient::new(&env, &contract_id);
    env.mock_all_auths();

    client.initialize(&admin, &token_addr, &10i128, &1_000i128);
    token_sac.mint(&player, &100_000i128);
    // No house funding: max 10x payout on even a small wager cannot be
    // covered, so the spin must be rejected.

    let client_seed = seed(&env, 5);
    let result = client.try_spin_wheel(&player, &100i128, &client_seed);
    assert!(result.is_err());
}

#[test]
fn test_paused_contract_rejects_spin() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    s.client.pause(&s.admin);
    assert!(s.client.is_paused());

    let client_seed = seed(&env, 6);
    let result = s.client.try_spin_wheel(&s.player, &100i128, &client_seed);
    assert!(result.is_err());

    s.client.unpause(&s.admin);
    assert!(!s.client.is_paused());
    // Now succeeds.
    let spin_id = s.client.spin_wheel(&s.player, &100i128, &client_seed);
    assert_eq!(spin_id, 1u64);
}

#[test]
fn test_pause_non_admin_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let non_admin = Address::generate(&env);
    let result = s.client.try_pause(&non_admin);
    assert!(result.is_err());
}

#[test]
fn test_get_wheel_segments() {
    let env = Env::default();
    let s = setup(&env);

    let segments = s.client.get_wheel_segments();
    assert_eq!(segments.len(), 8);
    assert_eq!(segments.get(0).unwrap(), 0u32);
    assert_eq!(segments.get(7).unwrap(), 1000u32);
}

#[test]
fn test_settle_already_settled_spin_rejected() {
    let env = Env::default();
    let s = setup(&env);
    env.mock_all_auths();

    let client_seed = seed(&env, 11);
    let spin_id = s.client.spin_wheel(&s.player, &100i128, &client_seed);
    let info = s.client.get_spin_info(&spin_id);
    let secret = find_secret_for_segment(&env, &client_seed, info.nonce, 2);

    s.client.settle_spin(&spin_id, &secret);
    let result = s.client.try_settle_spin(&spin_id, &secret);
    assert!(result.is_err());
}
