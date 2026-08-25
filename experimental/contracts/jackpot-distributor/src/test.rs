#![cfg(test)]

use soroban_sdk::{testutils::Address as _, token, Address, BytesN, Env};

use crate::{Error, JackpotDistributor, JackpotDistributorClient};

const TICKET_PRICE: i128 = 10;
const CARRYOVER_BPS: u32 = 1_000; // 10%

struct Setup {
    env: Env,
    client: JackpotDistributorClient<'static>,
    token: token::Client<'static>,
    admin: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());

    let contract_id = env.register(JackpotDistributor, ());
    let client = JackpotDistributorClient::new(&env, &contract_id);
    client.initialize(&admin, &sac.address(), &TICKET_PRICE, &CARRYOVER_BPS);

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
        admin,
    }
}

fn fund(s: &Setup, player: &Address, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.token.address).mint(player, &amount);
}

/// Seed whose first 8 big-endian bytes encode `index`.
fn seed_for_index(env: &Env, index: u64) -> BytesN<32> {
    let mut bytes = [0u8; 32];
    bytes[0..8].copy_from_slice(&index.to_be_bytes());
    BytesN::from_array(env, &bytes)
}

#[test]
fn ticket_ranges_are_contiguous_and_tracked_per_player() {
    let s = setup();
    let (a, b, c) = (
        Address::generate(&s.env),
        Address::generate(&s.env),
        Address::generate(&s.env),
    );
    fund(&s, &a, 1_000);
    fund(&s, &b, 1_000);
    fund(&s, &c, 1_000);

    assert_eq!(s.client.buy_tickets(&a, &3), (0, 2));
    assert_eq!(s.client.buy_tickets(&b, &2), (3, 4));
    assert_eq!(s.client.buy_tickets(&c, &5), (5, 9));
    // A second purchase by the same player appends a new contiguous range.
    assert_eq!(s.client.buy_tickets(&a, &1), (10, 10));

    let ranges = s.client.get_ticket_ranges();
    assert_eq!(ranges.len(), 4);
    let mut expected_start = 0u64;
    for range in ranges.iter() {
        assert_eq!(range.start, expected_start);
        assert!(range.end >= range.start);
        expected_start = range.end + 1;
    }

    assert_eq!(s.client.get_player_ticket_count(&a), 4);
    assert_eq!(s.client.get_player_ticket_count(&b), 2);
    assert_eq!(s.client.get_player_ticket_count(&c), 5);

    let info = s.client.get_current_epoch_info();
    assert_eq!(info.epoch, 0);
    assert_eq!(info.total_tickets, 11);
    assert_eq!(info.pool_value, 11 * TICKET_PRICE);
    assert_eq!(info.seed_value, 0);
    // Ticket cost left the players and sits in escrow.
    assert_eq!(s.token.balance(&a), 1_000 - 4 * TICKET_PRICE);
}

#[test]
fn draw_maps_ticket_index_to_correct_holder() {
    let s = setup();
    let (a, b, c) = (
        Address::generate(&s.env),
        Address::generate(&s.env),
        Address::generate(&s.env),
    );
    fund(&s, &a, 1_000);
    fund(&s, &b, 1_000);
    fund(&s, &c, 1_000);

    s.client.buy_tickets(&a, &3); // 0..=2
    s.client.buy_tickets(&b, &2); // 3..=4
    s.client.buy_tickets(&c, &5); // 5..=9

    // Index 3 falls on the first ticket of b's range.
    let result = s.client.draw_winner(&seed_for_index(&s.env, 3));
    assert_eq!(result.winning_ticket, 3);
    assert_eq!(result.winner, b);

    // Pool 100: 10% carryover kept, 90 paid out.
    assert_eq!(result.payout, 90);
    assert_eq!(result.carryover, 10);
    assert_eq!(s.token.balance(&b), 1_000 - 2 * TICKET_PRICE + 90);
}

#[test]
fn draw_boundaries_and_modulo_wrap() {
    let s = setup();
    let (a, b) = (Address::generate(&s.env), Address::generate(&s.env));
    fund(&s, &a, 1_000);
    fund(&s, &b, 1_000);

    s.client.buy_tickets(&a, &4); // 0..=3
    s.client.buy_tickets(&b, &6); // 4..=9

    // Last ticket of a's range.
    assert_eq!(s.client.draw_winner(&seed_for_index(&s.env, 3)).winner, a);

    // Epoch 1: same layout; a raw seed of 14 wraps to index 4 => b.
    s.client.buy_tickets(&a, &4);
    s.client.buy_tickets(&b, &6);
    let result = s.client.draw_winner(&seed_for_index(&s.env, 14));
    assert_eq!(result.winning_ticket, 4);
    assert_eq!(result.winner, b);
}

#[test]
fn single_player_always_wins_own_draw() {
    let s = setup();
    let solo = Address::generate(&s.env);
    fund(&s, &solo, 1_000);

    s.client.buy_tickets(&solo, &7);
    let result = s.client.draw_winner(&seed_for_index(&s.env, 123_456_789));
    assert_eq!(result.winner, solo);
    assert_eq!(result.winning_ticket, 123_456_789 % 7);
}

#[test]
fn epoch_rollover_carries_seed_and_resets_state() {
    let s = setup();
    let (a, b) = (Address::generate(&s.env), Address::generate(&s.env));
    fund(&s, &a, 1_000);
    fund(&s, &b, 1_000);

    s.client.buy_tickets(&a, &10); // pool 100
    let first = s.client.draw_winner(&seed_for_index(&s.env, 0));
    assert_eq!(first.epoch, 0);
    assert_eq!(first.carryover, 10);

    // New epoch: counters and ranges reset, seed carried over.
    let info = s.client.get_current_epoch_info();
    assert_eq!(info.epoch, 1);
    assert_eq!(info.total_tickets, 0);
    assert_eq!(info.seed_value, 10);
    assert_eq!(info.pool_value, 10);
    assert_eq!(s.client.get_player_ticket_count(&a), 0);
    assert_eq!(s.client.get_ticket_ranges().len(), 0);
    // The carryover stayed in escrow.
    assert_eq!(s.token.balance(&s.client.address), 10);

    // Next round's pool includes the seed: 10 + 50 = 60; payout 54, carry 6.
    s.client.buy_tickets(&b, &5);
    let second = s.client.draw_winner(&seed_for_index(&s.env, 2));
    assert_eq!(second.epoch, 1);
    assert_eq!(second.winner, b);
    assert_eq!(second.payout, 54);
    assert_eq!(second.carryover, 6);
    assert_eq!(s.client.get_current_epoch_info().epoch, 2);
    assert_eq!(s.token.balance(&s.client.address), 6);
}

#[test]
fn guards_hold() {
    let s = setup();
    let player = Address::generate(&s.env);
    fund(&s, &player, 1_000);

    // Draw with no tickets sold.
    assert_eq!(
        s.client.try_draw_winner(&seed_for_index(&s.env, 0)),
        Err(Ok(Error::NoTicketsSold))
    );
    // Zero or oversized ticket purchases.
    assert_eq!(
        s.client.try_buy_tickets(&player, &0),
        Err(Ok(Error::InvalidTicketCount))
    );
    assert_eq!(
        s.client.try_buy_tickets(&player, &10_001),
        Err(Ok(Error::InvalidTicketCount))
    );
    // Double initialization.
    assert_eq!(
        s.client
            .try_initialize(&s.admin, &s.token.address, &TICKET_PRICE, &CARRYOVER_BPS),
        Err(Ok(Error::AlreadyInitialized))
    );
}

#[test]
fn initialize_validation() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let contract_id = env.register(JackpotDistributor, ());
    let client = JackpotDistributorClient::new(&env, &contract_id);

    let player = Address::generate(&env);
    assert_eq!(
        client.try_buy_tickets(&player, &1),
        Err(Ok(Error::NotInitialized))
    );
    assert_eq!(
        client.try_get_current_epoch_info(),
        Err(Ok(Error::NotInitialized))
    );
    assert_eq!(
        client.try_initialize(&admin, &sac.address(), &0, &CARRYOVER_BPS),
        Err(Ok(Error::InvalidTicketPrice))
    );
    assert_eq!(
        client.try_initialize(&admin, &sac.address(), &TICKET_PRICE, &5_001),
        Err(Ok(Error::InvalidCarryover))
    );
}
